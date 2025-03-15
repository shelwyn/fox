# Fox Voice Assistant

A complete voice assistant solution with a Python backend for PDF processing and a Three.js-based interactive 3D frontend. This project enables users to chat with their documents using voice commands in an immersive space environment.

## Getting Started

1. Clone the repository:
```bash
git clone git@github.com:shelwyn/fox.git
cd fox
```

## Project Structure

- **fox-backend**: Python-based backend for processing PDFs and handling queries
- **fox-frontend**: Three.js-based 3D interactive frontend with voice recognition

## Prerequisites

- Node.js (version 14 or higher)
- Python 3.8+ with pip
- Modern web browser with microphone support (Chrome recommended)

## Backend Setup

1. Navigate to the backend directory:
```bash
cd fox-backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
uvicorn main:app --reload
```

The backend will run on http://localhost:8000

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd fox-frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the application:
   - Local development: http://localhost:3000
   - Network access: http://<your-ip-address>:3000

The frontend will run on http://localhost:3000

## Using the Application

### Step 1: Upload and Process PDF Documents

1. Ensure the backend is running (http://localhost:8000)
2. Upload your PDF document by sending a POST request to the upload endpoint:
   - Endpoint: http://localhost:8000/upload
   - Attach the PDF file
   - Provide a name for the document

Example using curl:
```bash
curl -X POST -F "file=@your_document.pdf" -F "name=your_document_name" http://localhost:8000/upload
```

This process creates embeddings for your document, making it ready for queries.

### Step 2: Interact with the Voice Assistant

1. Access the frontend application at http://localhost:3000
2. Enter the document name you uploaded in the input field
3. Click the "Start" button and allow microphone access when prompted
4. Say "fox" to activate the voice assistant
5. Ask your question when the blue wave appears
6. Wait for the response:
   - Yellow wave: Processing your query
   - Green wave: Speaking the response
7. The assistant will automatically return to listening mode (red wave)

## Features

### Backend
- PDF processing and text extraction
- Vector embeddings for document understanding
- Query processing and context-aware responses
- RESTful API for frontend communication

### Frontend
- Immersive 3D space environment with planets and asteroids
- Dynamic wave visualizations that respond to voice states
- Speech recognition for hands-free interaction
- Text-to-speech response playback
- Cross-device access through network support

## Building for Production

### Frontend
```bash
cd fox-frontend
npm run build
```
The built files will be in the `dist` directory.

### Backend
The backend can be deployed as a standard Python application. Consider using tools like Gunicorn for production deployment.

## Notes
- For best experience, use headphones to prevent audio feedback
- Microphone access is required for voice recognition functionality
- Ensure both backend and frontend are running concurrently for full functionality
