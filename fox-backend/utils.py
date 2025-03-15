import os
import faiss
import numpy as np
from typing import List
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter

class DocumentProcessor:
    def __init__(self):
        self.embeddings_dir = "embeddings"
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        os.makedirs(self.embeddings_dir, exist_ok=True)

    def process_pdf(self, file_path: str) -> List[str]:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return self.text_splitter.split_text(text)

    def create_embeddings(self, texts: List[str], name: str):
        embeddings = self.model.encode(texts)
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings.astype('float32'))
        
        # Save the index and texts
        faiss.write_index(index, f"{self.embeddings_dir}/{name}.index")
        with open(f"{self.embeddings_dir}/{name}.txt", 'w', encoding='utf-8') as f:
            for text in texts:
                f.write(text + "\n===CHUNK===\n")

    def query_embeddings(self, query: str, name: str, k: int = 3) -> List[str]:
        if not os.path.exists(f"{self.embeddings_dir}/{name}.index"):
            raise FileNotFoundError(f"No embeddings found for {name}")
        
        # Load the index and texts
        index = faiss.read_index(f"{self.embeddings_dir}/{name}.index")
        with open(f"{self.embeddings_dir}/{name}.txt", 'r', encoding='utf-8') as f:
            texts = f.read().split("===CHUNK===\n")
            texts = [t for t in texts if t.strip()]

        # Query the index
        query_vector = self.model.encode([query])
        D, I = index.search(query_vector.astype('float32'), k)
        
        return [texts[i] for i in I[0]]