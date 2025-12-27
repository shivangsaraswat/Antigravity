from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from app.services.chat import ChatService
from app.services.ingestion import IngestionService
from app.services.exam_upload import process_pdf_upload

app = FastAPI(title="Spirit AI Brain")

# Add CORS for admin uploads
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_service = ChatService()
ingestion_service = IngestionService()

class ChatRequest(BaseModel):
    message: str
    category: str = "all"
    history: list = [] # New: Support history

@app.get("/")
async def root():
    return {"status": "online", "message": "Spirit Brain is active"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = chat_service.ask(request.message, request.category, request.history)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(chat_service.stream_ask(request.message, request.category, request.history), media_type="text/plain")

class EmbeddingRequest(BaseModel):
    text: str

@app.post("/embeddings")
async def get_embeddings(request: EmbeddingRequest):
    try:
        embedding = chat_service.embed_model.get_text_embedding(request.text)
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest(category: str):
    # This triggers ingestion for the folder matching the category
    try:
        path = f"./data/raw_knowledge/{category}"
        ingestion_service.ingest_folder(path, category)
        return {"status": "success", "message": f"Ingested {category}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADMIN: Exam PDF Upload Endpoint (Temporary)
# ============================================
@app.post("/admin/upload-exam")
async def upload_exam_pdf(
    file: UploadFile = File(...),
    subject_name: str = Form(...),
    term: str = Form(...),
    exam_type: str = Form(default="Quiz 1")
):
    """
    Upload a PDF exam paper. Extracts questions, uploads images to ImageKit,
    and stores everything in the database.
    
    - file: PDF file
    - subject_name: e.g., "Mathematics for Data Science 1"
    - term: e.g., "January 2025"
    - exam_type: "Quiz 1", "Quiz 2", or "End Term"
    """
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted")
        
        pdf_bytes = await file.read()
        
        result = await process_pdf_upload(pdf_bytes, subject_name, term, exam_type)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

