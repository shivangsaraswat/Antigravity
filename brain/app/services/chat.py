from llama_index.llms.gemini import Gemini
from llama_index.embeddings.gemini import GeminiEmbedding
from app.core.config import Config
from sqlalchemy import create_engine, text
import logging

class ChatService:
    def __init__(self):
        # Switching to the newer 2.0 Flash Lite model to bypass the exhausted 1.5/2.5 Flash quota.
        self.llm = Gemini(model_name="models/gemini-flash-lite-latest", api_key=Config.GEMINI_API_KEY)
        self.embed_model = GeminiEmbedding(model_name="models/text-embedding-004", api_key=Config.GEMINI_API_KEY)
        self.engine = create_engine(Config.get_sqlalchemy_url())

    def ask(self, query, category="all"):
        # 1. Greeting Check (Skip RAG for simple greetings)
        greetings = ["hi", "hello", "hey", "who are you", "what is your name"]
        if query.lower().strip().rstrip("?") in greetings:
            return {
                "answer": "Hello! I am **Antigravity**, your academic mentor. I'm here to help you navigate your courses, research documents, and prepare for exams. How can I assist you today?",
                "sources": []
            }

        try:
            # 2. Generate embedding for the question
            query_embedding = self.embed_model.get_text_embedding(query)
            
            # 3. Search database for relevant chunks
            search_query = text("""
                SELECT content, category, title 
                FROM resources 
                ORDER BY embedding <=> :embedding 
                LIMIT 5
            """)
            
            with self.engine.connect() as conn:
                results = conn.execute(search_query, {"embedding": str(query_embedding).replace(" ", "")}).fetchall()
            
            # 4. Build the Context
            context = ""
            for r in results:
                context += f"SOURCE: {r.content}\n---\n"
            
            # 5. Prompt Gemini with Persona
            prompt = f"""
            You are Antigravity, an expert academic mentor. Your goal is to provide clear, accurate, and helpful answers based ONLY on the provided context if possible.
            
            RULES:
            - Provide a direct answer.
            - DO NOT mention "the context" or "the documents provided".
            - DO NOT give references or citations.
            - If the answer isn't in the context, use your general knowledge to help the student, but maintain the mentor persona.
            
            CONTEXT:
            {context}
            
            STUDENT QUESTION: {query}
            """
            
            response = self.llm.complete(prompt)
            return {
                "answer": response.text,
                "sources": [{"content": r.content[:100], "category": r.category, "title": r.title} for r in results]
            }
        except Exception as e:
            logger.error(f"❌ BRAIN ERROR: {str(e)}")
            error_str = str(e).lower()
            if "quota" in error_str or "429" in error_str:
                return {
                    "answer": "🚀 I'm thinking a bit too fast! My AI brain needs a 60-second break. Please try again in a moment.",
                    "sources": []
                }
            return {"answer": f"I encountered a slight technical hiccup. Could you try rephrasing that?", "sources": []}
