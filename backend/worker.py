import os
import time
from celery import Celery
from utils.retrieval import ingest_text
from database import SessionLocal, DocumentMetadata
import pypdf

celery_app = Celery(
    "rfp_tasks",
    broker=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    broker_connection_retry_on_startup=True
)

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - chunk_overlap
    return chunks

import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import google.generativeai as genai

# Initialize Qdrant Client
qdrant_client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

def get_embedding(text: str) -> list[float]:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768,
    )
    return result['embedding']

def setup_qdrant_collection(collection_name: str, vector_size: int):
    try:
        qdrant_client.get_collection(collection_name)
    except Exception:
        qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

@celery_app.task(name="process_pdf_task")
def process_pdf_task(document_id: int, file_path: str):
    db = SessionLocal()
    try:
        doc_record = db.query(DocumentMetadata).filter(DocumentMetadata.id == document_id).first()
        if not doc_record:
            return {"status": "Failed", "error": "Document not found in DB"}

        project_id = doc_record.project_id
        filename = doc_record.filename or "unknown"

        # 1. Extract text per page to preserve page numbers
        pdf_reader = pypdf.PdfReader(file_path)
        page_texts = []
        for page_num, page in enumerate(pdf_reader.pages, start=1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                page_texts.append({"page_number": page_num, "text": page_text})

        # 2. Chunk each page independently so page_number stays accurate
        page_chunks = []
        for page_info in page_texts:
            chunks = chunk_text(page_info["text"], 1000, 200)
            for chunk in chunks:
                if chunk.strip():
                    page_chunks.append({
                        "text": chunk,
                        "page_number": page_info["page_number"],
                    })
        
        # 3. Setup Qdrant & Embeddings
        collection_name = "rfp_chunks"
        vector_size = 768  # Size for Gemini embeddings
        setup_qdrant_collection(collection_name, vector_size)

        # 4. Embed and Upsert with full metadata
        points = []
        for i, chunk_info in enumerate(page_chunks):
            time.sleep(1)
            vector = get_embedding(chunk_info["text"])
            payload = {
                "chunk_text": chunk_info["text"],
                "document_id": document_id,
                "project_id": str(project_id),
                "filename": filename,
                "page_number": chunk_info["page_number"],
            }
            print(f"Ingesting point with project_id: {str(project_id)}, filename: {filename}, page: {chunk_info['page_number']}", flush=True)
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(id=point_id, vector=vector, payload=payload)
            )

        if points:
            qdrant_client.upsert(
                collection_name=collection_name,
                points=points
            )

        # 5. Update status in Postgres
        doc_record.status = "ready"
        doc_record.chunks = len(page_chunks)
        db.commit()
            
        return {"status": "Success", "chunks": len(page_chunks)}
    
    except Exception as e:
        db.rollback()
        doc_record = db.query(DocumentMetadata).filter(DocumentMetadata.id == document_id).first()
        if doc_record:
            doc_record.status = "Error"
            db.commit()
        return {"status": "Failed", "error": str(e)}
    finally:
        db.close()
        if os.path.exists(file_path):
            os.remove(file_path)