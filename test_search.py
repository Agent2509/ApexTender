import os
from google import genai

try:
    api_key = os.getenv("GEMINI_API_KEY", "dummy")
    client = genai.Client(api_key=api_key)
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents="test query",
        config={
            "task_type": "RETRIEVAL_QUERY",
            "output_dimensionality": 768
        }
    )
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
