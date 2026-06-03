import os
import json
import asyncio
from pydantic import ValidationError
import openai

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from schemas.contracts import RTMDocument
from utils.qdrant_manager import QdrantManager
from worker import celery_app
from utils.embeddings import generate_embeddings_gemini

class RTMGeneratorService:
    def __init__(self):
        self.qdrant = QdrantManager()
        # ME WAKE UP SKY BRAIN
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))
        
    async def _get_context_chunks(self, tenant_id: str, query: str) -> str:
        # ME ASK FOR ARROWS FOR QUERY
        query_vectors = await generate_embeddings_gemini([query])
        query_vector = query_vectors[0]
        
        # ME LOOK IN SECURE HOLE FOR MATCHING ARROWS WITH TENANT TAG
        search_results = self.qdrant.secure_search(tenant_id=tenant_id, query_vector=query_vector, limit=5)
        
        context_texts = [hit.payload.get("text", "") for hit in search_results if hit.payload]
        return "\n\n---\n\n".join(context_texts)

    async def generate_rtm(self, tenant_id: str, document_id: str, rules: list[str]) -> RTMDocument:
        all_rules_query = " ".join(rules)
        context_str = await self._get_context_chunks(tenant_id, all_rules_query)
        
        schema_json = RTMDocument.model_json_schema()
        
        system_prompt = (
            "You are an elite RTM generator. "
            "Output strictly valid JSON matching this schema: "
            f"{json.dumps(schema_json)}"
        )
        
        user_prompt = f"Rules:\n{json.dumps(rules)}\n\nContext:\n{context_str}\n\nGenerate the RTM."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        max_retries = 3
        for attempt in range(max_retries):
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                response_format={"type": "json_object"}
            )
            
            raw_content = response.choices[0].message.content
            
            try:
                # ME TRY PUT SKY WORDS IN CONTRACT BOX
                rtm_doc = RTMDocument.model_validate_json(raw_content)
                return rtm_doc
                
            except ValidationError as e:
                # ME YELL AT SKY BRAIN TO FIX MISTAKE!
                error_msg = f"Validation Error. Fix these exact schema issues and return full valid JSON: {str(e)}"
                messages.append({"role": "assistant", "content": raw_content})
                messages.append({"role": "user", "content": error_msg})
                
        raise ValueError("ME TRIED 3 TIMES. SKY BRAIN STILL BREAK CONTRACT.")

@celery_app.task(name="backend.services.rtm_generator.generate_rtm_task")
def generate_rtm_task(tenant_id: str, document_id: str):
    """BEAST WAKE UP TO DO LONG THINKING"""
    service = RTMGeneratorService()
    # DUMMY RULES FOR NOW
    rules = ["Find all SLA Penalties", "Find compliance deadlines"]
    result = asyncio.run(service.generate_rtm(tenant_id, document_id, rules))
    
    # ME PRINT RESULT (IN REAL CAVE, SAVE TO DB)
    print(f"RTM MATRIX DONE: {result.model_dump_json()}")
    return result.model_dump()
