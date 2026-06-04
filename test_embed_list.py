import os
from google import genai

api_key = os.getenv("GEMINI_API_KEY", "dummy")
client = genai.Client(api_key=api_key)
try:
    result = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=["test1", "test2"],
        config={
            "task_type": "RETRIEVAL_DOCUMENT",
            "output_dimensionality": 768
        }
    )
    print(f"Got {len(result.embeddings)} embeddings")
except Exception as e:
    print(f"Error: {e}")
