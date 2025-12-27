from llama_index.llms.gemini import Gemini
from llama_index.llms.groq import Groq
from llama_index.llms.cerebras import Cerebras
from llama_index.embeddings.gemini import GeminiEmbedding
from app.core.config import Config
from sqlalchemy import create_engine, text
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.llm_providers = []  # List of (llm_instance, provider_name)
        
        # Provider 1: Gemini 2.0 Flash (1M context, free tier)
        if Config.GEMINI_API_KEY:
            try:
                gemini = Gemini(model_name="models/gemini-2.0-flash", api_key=Config.GEMINI_API_KEY)
                self.llm_providers.append((gemini, "Gemini 2.0 Flash"))
                logger.info("✅ Provider 1: Gemini 2.0 Flash initialized")
            except Exception as e:
                logger.warning(f"⚠️ Could not initialize Gemini: {e}")
        
        # Provider 2: Groq Llama 3.3 70B (128K context, free tier, ultra-fast)
        if Config.GROQ_API_KEY:
            try:
                groq = Groq(model="llama-3.3-70b-versatile", api_key=Config.GROQ_API_KEY)
                self.llm_providers.append((groq, "Groq Llama 3.3 70B"))
                logger.info("✅ Provider 2: Groq Llama 3.3 70B initialized")
            except Exception as e:
                logger.warning(f"⚠️ Could not initialize Groq: {e}")
        
        # Provider 3: Cerebras Llama 3.3 70B (Ultra-fast inference)
        if Config.CEREBRAS_API_KEY:
            try:
                cerebras = Cerebras(model="llama-3.3-70b", api_key=Config.CEREBRAS_API_KEY)
                self.llm_providers.append((cerebras, "Cerebras Llama 3.3 70B"))
                logger.info("✅ Provider 3: Cerebras Llama 3.3 70B initialized")
            except Exception as e:
                logger.warning(f"⚠️ Could not initialize Cerebras: {e}")
        
        if not self.llm_providers:
            logger.error("❌ No LLM providers configured!")
        
        # Embeddings (still use Gemini - it's separate quota)
        self.embed_model = GeminiEmbedding(model_name="models/text-embedding-004", api_key=Config.GEMINI_API_KEY)
        self.engine = create_engine(Config.get_sqlalchemy_url())

    def _is_rate_limit_error(self, error):
        """Check if an error is a rate limit/quota error."""
        error_str = str(error).lower()
        return any(x in error_str for x in ["429", "quota", "rate", "limit", "exceeded", "resource_exhausted"])

    def _call_with_fallback(self, prompt, stream=False):
        """Try each LLM provider in order, fallback on rate limit errors."""
        last_error = None
        
        for llm, name in self.llm_providers:
            try:
                logger.info(f"🔄 Trying {name}...")
                if stream:
                    # For streaming, we need to try getting first chunk to detect errors
                    stream_gen = llm.stream_complete(prompt)
                    # Try to get the first item to catch immediate errors
                    first_chunk = None
                    try:
                        first_chunk = next(iter(stream_gen))
                    except StopIteration:
                        pass
                    except Exception as e:
                        raise e  # Re-raise to be caught by outer try
                    
                    # If we got here, provider works. Return a generator that includes first chunk
                    def gen_with_first(first, rest):
                        if first is not None:
                            yield first
                        for chunk in rest:
                            yield chunk
                    
                    return gen_with_first(first_chunk, stream_gen), name
                else:
                    return llm.complete(prompt), name
            except Exception as e:
                last_error = e
                if self._is_rate_limit_error(e):
                    logger.warning(f"⚠️ {name} rate limited, trying next provider...")
                    continue
                else:
                    logger.warning(f"⚠️ {name} error: {e}, trying next provider...")
                    continue
        
        raise Exception(f"All LLM providers failed! Last error: {last_error}")

    def ask(self, query, category="all", history=None):
        # 1. Greeting Check
        greetings = ["hi", "hello", "hey", "who are you", "what is your name"]
        if query.lower().strip().rstrip("?") in greetings:
            return {
                "answer": "Hello and Welcome. My name is Spirit, and I'm thrilled to be your academic mentor. I'm here to support and guide you throughout your learning journey, providing you with helpful insights, explanations, and resources to help you succeed.\n\nPlease feel free to ask me any questions, share your concerns, or discuss topics that interest you. I'm all ears and ready to help. What's on your mind today?",
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
                    role = "STUDENT" if h.get('role') == 'user' else "SPIRIT"
                    history_str += f"{role}: {h.get('content')}\n"

            # 6. Improved Prompt
            prompt = f"""
            You are Spirit, a warm, supportive, and highly knowledgeable academic mentor. You are not just an AI answering questions; you are a partner in the student's learning journey.

            CORE PERSONA:
            - **Human & Natural**: Speak like a helpful professor or a brilliant senior student. Avoid robotic phrases.
            - **Supportive**: Validate the student's efforts and feelings.
            - **Clear & Structured**: Use Markdown (bold, lists) for clarity.
            - **Context-Aware**: Use CONTEXT naturally without explicitly mentioning it.

            INSTRUCTIONS:
            - **Prioritize Context**: Use CONTEXT information if relevant.
            - **General Knowledge**: Answer general questions fully.
            - **No Meta-Talk**: Do not reference "context", "files", or "documents".
            - Provide detailed, helpful answers with Markdown.
            
            CONVERSATION HISTORY:
            {history_str}
            
            CONTEXT FROM ACADEMIC DOCS:
            {context}
            
            STUDENT QUESTION: {query}
            """
            
            response, provider = self._call_with_fallback(prompt, stream=False)
            logger.info(f"✅ Response from {provider}")
            return {
                "answer": response.text,
                "sources": [{"content": r.content[:100], "category": r.category, "title": r.title} for r in results]
            }
        except Exception as e:
            logger.error(f"❌ BRAIN ERROR: {str(e)}")
            return {"answer": f"I encountered a slight technical hiccup: {str(e)}", "sources": []}

    def stream_ask(self, query, category="all", history=None):
        # 1. Greeting Check
        greetings = ["hi", "hello", "hey", "who are you", "what is your name"]
        if query.lower().strip().rstrip("?") in greetings:
            yield "Hello and Welcome. My name is **Spirit**, and I'm thrilled to be your academic mentor. I'm here to support and guide you throughout your learning journey, providing you with helpful insights, explanations, and resources to help you succeed.\n\nPlease feel free to ask me any questions, share your concerns, or discuss topics that interest you. I'm all ears and ready to help. What's on your mind today?"
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
                    role = "STUDENT" if h.get('role') == 'user' else "SPIRIT"
                    history_str += f"{role}: {h.get('content')}\n"

            # 6. Improved STREAMING Prompt
            prompt = f"""
            You are Spirit, a warm, supportive, and highly knowledgeable academic mentor. You are not just an AI answering questions; you are a partner in the student's learning journey.

            CORE PERSONA:
            - **Human & Natural**: Speak like a helpful professor or a brilliant senior student. Avoid robotic phrases like "As an AI" or "Based on the context provided".
            - **Supportive & Encouraging**: If a student is stressed, offer reassurance along with the answer. Validate their efforts.
            - **Clear & Structured**: Use Markdown effectively (bolding key terms, using lists) to make complex information easy to digest.
            - **Context-Aware**: Use the provided CONTEXT to answer accurately, but integrate it naturally into your explanation.

            INSTRUCTIONS:
            - **Prioritize Context**: If the student's question relates to the CONTEXT, use that information as the primary source.
            - **General Knowledge**: If the question is general (e.g., "how to stay motivated", "explain gravity"), use your own vast knowledge.
            - **Formatting**: ALWAYS use Markdown to structure your response. 
            - **No Meta-Talk**: Never mention "context blocks", "uploaded files", or "retrieved documents". Just provide the answer.
            
            CONVERSATION HISTORY:
            {history_str}
            
            CONTEXT:
            {context}
            
            STUDENT QUESTION: {query}
            """
            
            # Use stream_complete with fallback
            response_stream, provider = self._call_with_fallback(prompt, stream=True)
            logger.info(f"✅ Streaming from {provider}")
            for chunk in response_stream:
                yield chunk.delta
                
        except Exception as e:
            logger.error(f"❌ BRAIN STREAM ERROR: {str(e)}")
            yield f"Error: {str(e)}"
