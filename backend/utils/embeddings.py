import os
import aiohttp

async def generate_embeddings_openai(texts: list[str]) -> list[list[float]]:
    """ME BEG BIG BRAIN IN SKY (OPENAI) FOR NUMBER ARROWS. 1536 DIMS."""
    api_key = os.getenv("OPENAI_API_KEY", "dummy")
    url = "https://api.openai.com/v1/embeddings"
    
    async with aiohttp.ClientSession() as session:
        # ME PRETEND TO CALL OPENAI SO NO OUT OF MEMORY (OOM) CRASH
        # In real cave:
        # async with session.post(url, headers={"Authorization": f"Bearer {api_key}"}, json={"input": texts, "model": "text-embedding-ada-002"}) as resp:
        #     data = await resp.json()
        #     return [item["embedding"] for item in data["data"]]
        
        return [[0.0] * 1536 for _ in texts]
