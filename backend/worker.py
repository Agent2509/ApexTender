import os
import asyncio
from celery import Celery
from sqlalchemy import text

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import tenant_id_context_var, async_session_maker
from utils.parser import MemorySafeParser

celery_app = Celery(
    "rfp_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
)

# IMPORT RTM GENERATOR SO BEAST KNOWS ABOUT TASK
import services.rtm_generator

async def update_db_status(tenant_id: str, file_path: str):
    # ME PUT SECRET POUCH IN BACKGROUND BEAST
    token = tenant_id_context_var.set(tenant_id)
    try:
        async with async_session_maker() as session:
            # HEAVY ROCK DOOR ACTIVATED
            await session.execute(
                text("SET LOCAL app.tenant_id = :tenant"),
                {"tenant": tenant_id}
            )
            # ME FIND ROCK BY NAME AND MARK IT DONE
            filename = os.path.basename(file_path)
            await session.execute(
                text("UPDATE rfp_documents SET status = 'COMPLETED' WHERE filename = :fname"),
                {"fname": filename}
            )
            await session.commit()
    finally:
        tenant_id_context_var.reset(token)

@celery_app.task(bind=True)
def process_document_task(self, file_path: str, tenant_id: str):
    temp_file_path = file_path
    is_temp = False
    try:
        if file_path.startswith("http"):
            import tempfile
            import requests
            response = requests.get(file_path)
            response.raise_for_status()
            
            tf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            tf.write(response.content)
            tf.close()
            temp_file_path = tf.name
            is_temp = True
            
        # BEAST READ ROCK WITHOUT CRUSHING CAVE
        parser = MemorySafeParser(temp_file_path)
        parser.parse()
        
        # BEAST TELL BOSS HE DONE
        asyncio.run(update_db_status(tenant_id, file_path))
        
    finally:
        # BEAST CLEAN UP HIS MESS
        if is_temp and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        elif not is_temp and os.path.exists(file_path):
            os.remove(file_path)

from utils.chunker import SemanticChunker
from utils.qdrant_manager import QdrantManager
import aiohttp
import uuid

from utils.embeddings import generate_embeddings_openai

async def update_db_status_indexed(tenant_id: str, document_id: str):
    token = tenant_id_context_var.set(tenant_id)
    try:
        async with async_session_maker() as session:
            await session.execute(
                text("SET LOCAL app.tenant_id = :tenant"),
                {"tenant": tenant_id}
            )
            # ME FIND ROCK BY ID AND MARK IT INDEXED
            await session.execute(
                text("UPDATE rfp_documents SET status = 'INDEXED' WHERE id = :did::uuid"),
                {"did": document_id}
            )
            await session.commit()
    finally:
        tenant_id_context_var.reset(token)

@celery_app.task(bind=True)
def embed_document_task(self, text_content: str, document_id: str, tenant_id: str):
    try:
        # 1. CHOP BIG ROCK
        chunker = SemanticChunker(chunk_size=1000, overlap=200)
        chunks = chunker.chunk_text(text_content, page_num=1)
        
        if not chunks:
            return
            
        texts_to_embed = [c["text"] for c in chunks]
        
        # 2. GET ARROWS FROM SKY GOD
        embeddings = asyncio.run(generate_embeddings_openai(texts_to_embed))
        
        # 3. PUT ARROWS IN QDRANT HOLE WITH TENANT TAG
        qdrant = QdrantManager()
        qdrant.init_collection()
        
        points = []
        for i, emb in enumerate(embeddings):
            from qdrant_client.http import models
            point = models.PointStruct(
                id=str(uuid.uuid4()),
                vector=emb,
                payload={"text": texts_to_embed[i], "document_id": document_id}
            )
            points.append(point)
            
        # SECURE UPSERT WILL FORCE TENANT_ID ON ALL POINTS
        qdrant.secure_upsert(tenant_id=tenant_id, points=points)
        
        # 4. TELL BOSS IT IS INDEXED
        asyncio.run(update_db_status_indexed(tenant_id, document_id))
        
    except Exception as e:
        print(f"BEAST FAILED TO EMBED: {e}")