import os
from google import genai

async def generate_embeddings_gemini(texts: list[str]) -> list[list[float]]:
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    result = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=texts,
        config={
            "task_type": "RETRIEVAL_DOCUMENT",
            "output_dimensionality": 768
        }
    )
    return [e.values for e in result.embeddings]
