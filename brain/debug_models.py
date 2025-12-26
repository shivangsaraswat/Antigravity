import os
import google.generativeai as genai
from dotenv import load_dotenv

# Try to load from both locations just in case
load_dotenv()
load_dotenv("../backend/.env")

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if api_key else 'No'}")

if api_key:
    genai.configure(api_key=api_key)
    try:
        print("Available models:")
        for m in genai.list_models():
            print(f"  - {m.name} (Methods: {m.supported_generation_methods})")
    except Exception as e:
        print(f"Error listing models: {e}")
else:
    print("GEMINI_API_KEY not found in environment.")
