from llama_index.llms.gemini import Gemini
from llama_index.embeddings.gemini import GeminiEmbedding
from app.core.config import Config
from sqlalchemy import create_engine, text
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        # Switching back to standard 1.5 Flash as 8b was not found.
        self.llm = Gemini(model_name="models/gemini-1.5-flash", api_key=Config.GEMINI_API_KEY)
        self.embed_model = GeminiEmbedding(model_name="models/text-embedding-004", api_key=Config.GEMINI_API_KEY)
        self.engine = create_engine(Config.get_sqlalchemy_url())

    def ask(self, query, category="all", history=None):
        # 1. Greeting Check
        greetings = ["hi", "hello", "hey", "who are you", "what is your name"]
        if query.lower().strip().rstrip("?") in greetings:
            return {
                "answer": "Hello! I am **Antigravity**, your academic mentor. I'm here to help you navigate your courses, research documents, and prepare for exams. How can I assist you today?",
                "sources": []
            }

        try:
            # 2. Embedding
            query_embedding = self.embed_model.get_text_embedding(query)
            
            # 3. Search
            search_query = text("""
                SELECT content, category, title 
                FROM resources 
                ORDER BY embedding <=> :embedding 
                LIMIT 5
            """)
            
            with self.engine.connect() as conn:
                results = conn.execute(search_query, {"embedding": str(query_embedding).replace(" ", "")}).fetchall()
            
            # 4. Context
            context = ""
            for r in results:
                context += f"SOURCE: {r.content}\n---\n"
            
            # 5. History Formatting
            history_str = ""
            if history:
                for h in history[-5:]:
                    role = "STUDENT" if h.get('role') == 'user' else "ANTIGRAVITY"
                    history_str += f"{role}: {h.get('content')}\n"

            # 6. Improved Prompt
            prompt = f"""
            You are Antigravity, an expert academic mentor and a highly capable AI. 
            
            KNOWLEDGE BASE:
            You have access to specific course documents (provided in CONTEXT) and your vast internal pre-trained knowledge.
            
            INSTRUCTIONS:
            - If the student's question relates to the CONTEXT, prioritize that information.
            - If the question is general or not in the CONTEXT (like "who is codewithharry" or "how to bake a cake"), answer using your general knowledge fully. 
            - Never mention "context," "provided materials," or "files." Just speak naturally.
            - Provide detailed, helpful answers with Markdown.
            
            CONVERSATION HISTORY:
            {history_str}
            
            CONTEXT FROM ACADEMIC DOCS:
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
            return {"answer": f"I encountered a slight technical hiccup.", "sources": []}

    def stream_ask(self, query, category="all", history=None):
        # 1. Greeting Check
        greetings = ["hi", "hello", "hey", "who are you", "what is your name"]
        if query.lower().strip().rstrip("?") in greetings:
            yield "Hello! I am **Antigravity**, your academic mentor. I'm here to help you navigate your courses, research documents, and prepare for exams. How can I assist you today?"
            return

        try:
            # 2. Embedding
            query_embedding = self.embed_model.get_text_embedding(query)
            
            # 3. Search
            search_query = text("""
                SELECT content, category, title 
                FROM resources 
                ORDER BY embedding <=> :embedding 
                LIMIT 5
            """)
            
            with self.engine.connect() as conn:
                results = conn.execute(search_query, {"embedding": str(query_embedding).replace(" ", "")}).fetchall()
            
            # 4. Context
            context = ""
            for r in results:
                context += f"SOURCE: {r.content}\n---\n"
            
            # 5. History Formatting
            history_str = ""
            if history:
                for h in history[-5:]:
                    role = "STUDENT" if h.get('role') == 'user' else "ANTIGRAVITY"
                    history_str += f"{role}: {h.get('content')}\n"

            # 6. Improved STREAMING Prompt
            prompt = f"""
            You are Antigravity, an expert academic mentor and a highly capable AI. 
            
            INSTRUCTIONS:
            - If the student's question relates to the CONTEXT, prioritize that information.
            - If the question is general or not in the CONTEXT, answer using your general knowledge fully.
            - Do NOT mention context/files. Just answer.
            - Use Markdown (points, bold).
            
            CONVERSATION HISTORY:
            {history_str}
            
            CONTEXT:
            {context}
            
            STUDENT QUESTION: {query}
            """
            
            # Use stream_complete
            response_stream = self.llm.stream_complete(prompt)
            for chunk in response_stream:
                yield chunk.delta
                
        except Exception as e:
            logger.error(f"❌ BRAIN STREAM ERROR: {str(e)}")
            yield f"Error: {str(e)}"
