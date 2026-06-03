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

def update_db_status(tenant_id: str, file_path: str):
    # ME PUT SECRET POUCH IN BACKGROUND BEAST
    token = tenant_id_context_var.set(tenant_id)
    try:
        with SessionLocal() as session:
            # HEAVY ROCK DOOR ACTIVATED
            session.execute(
                text("SELECT set_config('app.tenant_id', :tenant, true)"),
                {"tenant": tenant_id}
            )
            # ME FIND ROCK BY NAME AND MARK IT DONE
            filename = os.path.basename(file_path)
            session.execute(
                text("UPDATE documents SET status = 'COMPLETED' WHERE filename = :fname"),
                {"fname": filename}
            )
            session.commit()
    finally:
        tenant_id_context_var.reset(token)

@celery_app.task(bind=True)
def process_document_task(self, file_path: str, tenant_id: str, document_id: str = None):
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
        
        # BEAST TELL BOSS HE DONE
        update_db_status(tenant_id, file_path)
        
        if document_id:
            embed_document_task.delay(text_content, document_id, tenant_id)
        
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

from utils.embeddings import generate_embeddings_gemini

def update_db_status_indexed(tenant_id: str, document_id: str):
    token = tenant_id_context_var.set(tenant_id)
    try:
        with SessionLocal() as session:
            session.execute(
                text("SELECT set_config('app.tenant_id', :tenant, true)"),
                {"tenant": tenant_id}
            )
            # ME FIND ROCK BY ID AND MARK IT INDEXED
            session.execute(
                text("UPDATE documents SET status = 'INDEXED' WHERE id = :did"),
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
def embed_document_task(self, text_content: str, document_id: str, tenant_id: str):
    try:
        doc_meta = get_document_metadata(tenant_id, document_id)
        if not doc_meta:
            print(f"DOCUMENT {document_id} NOT FOUND IN DB!")
            return
        project_id = str(doc_meta.project_id)
        filename = doc_meta.filename

        # 1. CHOP BIG ROCK
        print(f"[EMBED] Chunking document {document_id}...", flush=True)
        chunker = SemanticChunker(chunk_size=1000, overlap=200)
        chunks = chunker.chunk_text(text_content, page_num=1)
        print(f"[EMBED] Created {len(chunks)} chunks for document {document_id}.", flush=True)
        
        if not chunks:
            print(f"[EMBED] Warning: No chunks extracted! Document {document_id} might be a scanned image. Marking as indexed to prevent getting stuck.", flush=True)
            update_db_status_indexed(tenant_id, document_id)
            return
            
        texts_to_embed = [c["text"] for c in chunks]
        
        # 2. GET ARROWS FROM SKY GOD
        embeddings = generate_embeddings_gemini(texts_to_embed)
        
        # 3. PUT ARROWS IN QDRANT HOLE WITH TENANT TAG
        qdrant = QdrantManager()
        qdrant.init_collection()
        
        points = []
        for i, emb in enumerate(embeddings):
            from qdrant_client.http import models
            point = models.PointStruct(
                id=str(uuid.uuid4()),
                vector=emb,
                payload={
                    "text": texts_to_embed[i], 
                    "document_id": document_id,
                    "project_id": project_id,
                    "filename": filename
                }
            )
            points.append(point)
            
        # SECURE UPSERT WILL FORCE TENANT_ID ON ALL POINTS
        qdrant.secure_upsert(tenant_id=tenant_id, points=points)
        
        # 4. TELL BOSS IT IS INDEXED
        update_db_status_indexed(tenant_id, document_id)
        
    except Exception as e:
        print(f"BEAST FAILED TO EMBED: {e}")