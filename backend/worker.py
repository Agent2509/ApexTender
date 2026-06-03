import os
import asyncio
from celery import Celery
from sqlalchemy import text

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import tenant_id_context_var, SessionLocal
from utils.parser import MemorySafeParser

celery_app = Celery(
    "rfp_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
)

# IMPORT RTM GENERATOR SO BEAST KNOWS ABOUT TASK
import services.rtm_generator

from utils.chunker import SemanticChunker
from utils.qdrant_manager import QdrantManager
import aiohttp
import uuid

from utils.embeddings import generate_embeddings_gemini

def update_db_status_indexed(tenant_id: str, document_id: str):
    token = tenant_id_context_var.set(tenant_id)
    try:
        with SessionLocal() as session:
            session.execute(
                text("SELECT set_config('app.tenant_id', :tenant, true)"),
                {"tenant": tenant_id}
            )
            # ME FIND ROCK BY ID AND MARK IT COMPLETED
            session.execute(
                text("UPDATE documents SET status = 'COMPLETED' WHERE id = :did"),
                {"did": int(document_id)}
            )
            session.commit()
    finally:
        tenant_id_context_var.reset(token)

def get_document_metadata(tenant_id: str, document_id: str):
    token = tenant_id_context_var.set(tenant_id)
    try:
        with SessionLocal() as session:
            session.execute(
                text("SELECT set_config('app.tenant_id', :tenant, true)"),
                {"tenant": tenant_id}
            )
            result = session.execute(
                text("SELECT project_id, filename FROM documents WHERE id = :did"),
                {"did": int(document_id)}
            )
            return result.fetchone()
    finally:
        tenant_id_context_var.reset(token)

@celery_app.task(bind=True)
def process_and_embed_document_task(self, file_path: str, tenant_id: str, document_id: str):
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
            
        print(f"[PROCESS] Reading PDF: {file_path}", flush=True)
        # BEAST READ ROCK WITHOUT CRUSHING CAVE
        parser = MemorySafeParser(temp_file_path)
        text_content = parser.parse()
        print(f"[PROCESS] Extracted {len(text_content)} characters from PDF.", flush=True)
        
        doc_meta = get_document_metadata(tenant_id, document_id)
        if not doc_meta:
            print(f"DOCUMENT {document_id} NOT FOUND IN DB!")
            return
        project_id = str(doc_meta.project_id)
        filename = doc_meta.filename

        # 1. CHOP BIG ROCK
        print(f"[EMBED] Chunking document {document_id}...", flush=True)
        
        def memory_safe_chunker(text: str, chunk_size=1000, overlap=200):
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                yield {"text": text[start:end]}
                if end == len(text):
                    break
                start += chunk_size - overlap
                
        chunk_generator = memory_safe_chunker(text_content, 1000, 200)
        
        qdrant = QdrantManager()
        qdrant.init_collection()
        
        batch_size = 10
        import itertools
        batch_num = 1
        
        while True:
            batch_chunks = list(itertools.islice(chunk_generator, batch_size))
            if not batch_chunks:
                if batch_num == 1:
                    print(f"[EMBED] Warning: No chunks extracted! Document {document_id} might be a scanned image. Marking as indexed to prevent getting stuck.", flush=True)
                    update_db_status_indexed(tenant_id, document_id)
                    return
                break
                
            batch_texts = [c["text"] for c in batch_chunks]
            
            print(f"[EMBED] Processing batch {batch_num} ({len(batch_texts)} chunks)...", flush=True)
            batch_num += 1
            
            # 2. GET ARROWS FROM SKY GOD
            batch_embeddings = generate_embeddings_gemini(batch_texts)
            
            # 3. PUT ARROWS IN QDRANT HOLE WITH TENANT TAG
            points = []
            for j, emb in enumerate(batch_embeddings):
                from qdrant_client.http import models
                point = models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=emb,
                    payload={
                        "tenant_id": str(tenant_id),
                        "text": batch_texts[j], 
                        "document_id": document_id,
                        "project_id": str(project_id),
                        "filename": filename
                    }
                )
                points.append(point)
                
            # SECURE UPSERT WILL FORCE TENANT_ID ON ALL POINTS
            qdrant.secure_upsert(tenant_id=tenant_id, points=points)
            
            # CLEAR MEMORY REFERENCES
            del batch_chunks
            del batch_texts
            del batch_embeddings
            del points
            
            import gc
            gc.collect()
            
        # 4. TELL BOSS IT IS INDEXED
        update_db_status_indexed(tenant_id, document_id)
        
    except Exception as e:
        print(f"BEAST FAILED TO EMBED: {e}")
        raise e
    finally:
        # BEAST CLEAN UP HIS MESS
        if is_temp and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        elif not is_temp and os.path.exists(file_path):
            os.remove(file_path)