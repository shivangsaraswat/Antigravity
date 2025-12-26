from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from app.services.chat import ChatService
from app.services.ingestion import IngestionService

app = FastAPI(title="Antigravity AI Brain")
chat_service = ChatService()
ingestion_service = IngestionService()

class ChatRequest(BaseModel):
    message: str
    category: str = "all"
    history: list = [] # New: Support history

@app.get("/")
async def root():
    return {"status": "online", "message": "Antigravity Brain is active"}

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
