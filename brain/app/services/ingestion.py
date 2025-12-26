import os
from llama_index.core import SimpleDirectoryReader, StorageContext
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.llms.gemini import Gemini
from llama_index.core.node_parser import SentenceSplitter
from app.core.config import Config
from pgvector.sqlalchemy import Vector
from sqlalchemy import create_engine, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IngestionService:
    def __init__(self):
        self.embed_model = GeminiEmbedding(model_name="models/text-embedding-004", api_key=Config.GEMINI_API_KEY)
        self.engine = create_engine(Config.get_sqlalchemy_url())

    def ingest_folder(self, folder_path, category):
        logger.info(f"Starting ingestion for category: {category} from {folder_path}")
        reader = SimpleDirectoryReader(input_dir=folder_path)
        documents = reader.load_data()
        return self.ingest_documents(documents, category)

    def ingest_documents(self, documents, category):
        # 2. Split into chunks (Sentence-aware)
        parser = SentenceSplitter(chunk_size=512, chunk_overlap=50)
        nodes = parser.get_nodes_from_documents(documents)
        
        # 3. Process each chunk
        for node in nodes:
            content = node.get_content()
            embedding = self.embed_model.get_text_embedding(content)
            
            # 4. Save to our Go-compatible 'resources' table
            # We map: category -> category, metadata.file_name -> title
            embed_str = str(embedding).replace(" ", "")
            
            query = text("""
                INSERT INTO resources (created_at, updated_at, category, title, content, embedding)
                VALUES (NOW(), NOW(), :category, :title, :content, :embedding)
            """)
            
            with self.engine.connect() as conn:
                conn.execute(query, {
                    "category": category,
                    "title": node.metadata.get("file_name", "Unknown"),
                    "content": content,
                    "embedding": embed_str
                })
                conn.commit()
            
            logger.info(f"Chunk saved: {node.metadata.get('file_name', 'Unknown')}")
        
        logger.info(f"Successfully {category} ingestion complete.")
        return len(nodes)

if __name__ == "__main__":
    # Test run
    service = IngestionService()
    # Assume folders exist from our previous setup
    service.ingest_folder("./data/raw_knowledge/academic", "academic")
