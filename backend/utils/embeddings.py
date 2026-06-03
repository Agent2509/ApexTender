import os
from google import genai
import time

def generate_embeddings_gemini(texts: list[str]) -> list[list[float]]:
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    print(f"[EMBED] Requesting embeddings for {len(texts)} chunks...", flush=True)
    try:
        result = client.models.embed_content(
            model="models/text-embedding-004",
            contents=texts,
            config={
                "task_type": "RETRIEVAL_DOCUMENT",
                "output_dimensionality": 768
            }
        )
        return [e.values for e in result.embeddings]
    except Exception as e:
        print(f"[EMBED] Error embedding batch: {e}", flush=True)
        # Give API a moment to recover if rate limited
        time.sleep(2)
        result = client.models.embed_content(
            model="models/text-embedding-004",
            contents=texts,
            config={
                "task_type": "RETRIEVAL_DOCUMENT",
                "output_dimensionality": 768
            }
        )
        return [e.values for e in result.embeddings]
