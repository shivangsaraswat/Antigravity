import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../backend/.env") # Link to your existing backend env

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Fallback LLM #1
    CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")  # Fallback LLM #2
    DATABASE_URL = os.getenv("DATABASE_URL") # Ensure this is in your .env
    # Fallback if DATABASE_URL isn't full
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "antigravity")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASS = os.getenv("DB_PASSWORD", "")
    DB_PORT = os.getenv("DB_PORT", "5432")

    @classmethod
    def get_sqlalchemy_url(cls):
        if cls.DATABASE_URL:
            # Handle neon/postgres strings
            return cls.DATABASE_URL.replace("postgres://", "postgresql://")
        return f"postgresql://{cls.DB_USER}:{cls.DB_PASS}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
