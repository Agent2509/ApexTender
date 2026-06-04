import os
import asyncio
from google import genai

async def test():
    api_key = os.getenv("GEMINI_API_KEY", "dummy")
    client = genai.Client(api_key=api_key)
    try:
        response = await client.aio.models.generate_content_stream(
            model="gemini-1.5-flash",
            contents="test"
        )
        async for chunk in response:
            pass
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
