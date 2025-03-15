import os
import re
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
from utils import DocumentProcessor
import httpx
import json
from typing import AsyncGenerator

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend application URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

doc_processor = DocumentProcessor()

class QueryRequest(BaseModel):
    name: str
    query: str

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    name: str = Form(...)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
    
    try:
        # Process the PDF and create embeddings
        texts = doc_processor.process_pdf(temp_path)
        doc_processor.create_embeddings(texts, name)
        return {"message": f"PDF processed and embeddings created for {name}"}
    finally:
        os.unlink(temp_path)  # Clean up temp file

async def generate_response(content: str, query: str) -> str:
    prompt = f"Context: {content}\n\nQuestion: {query}\n\nAnswer: "
    print(f"Sending prompt to Ollama: {prompt}")
    
    timeout_settings = httpx.Timeout(
        connect=30.0,
        read=300.0,
        write=30.0,
        pool=30.0
    )
    
    complete_response = []
    async with httpx.AsyncClient(timeout=timeout_settings) as client:
        try:
            async with client.stream('POST', 'http://localhost:11434/api/generate', 
                                   json={
                                       "model": "llama3.2:1b",
                                       "prompt": prompt,
                                       "stream": True
                                   }) as response:
                print(f"Ollama response status: {response.status_code}")
                async for chunk in response.aiter_lines():
                    if chunk:
                        try:
                            data = json.loads(chunk)
                            if 'response' in data:
                                cleaned_response = re.sub(r'[!@#$%^&*]', '', data['response'])
                                complete_response.append(cleaned_response)
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e}")
                            continue
        except Exception as e:
            print(f"Error during response generation: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    return ''.join(complete_response)

@app.post("/query")
async def query_document(request: QueryRequest):
    try:
        print(f"Received query request - name: {request.name}, query: {request.query}")
        relevant_chunks = doc_processor.query_embeddings(request.query, request.name)
        context = " ".join(relevant_chunks)
        print(f"Found context: {context[:100]}...")
        
        response_text = await generate_response(context, request.query)
        return {"response": response_text}
        
    except FileNotFoundError as e:
        print(f"File not found error: {e}")
        raise HTTPException(status_code=404, detail=f"No embeddings found for {request.name}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))