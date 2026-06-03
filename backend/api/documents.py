from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
import uuid

# ABSOLUTE IMPORTS ONLY
from api.dependencies import get_current_user_token
from database import get_db, DocumentMetadata
from worker import process_and_embed_document_task
from supabase import create_client
from utils.retrieval import qdrant
from qdrant_client.models import Filter, FieldCondition, MatchValue

router = APIRouter()

@router.get("")
def list_documents(project_id: str, user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    return db.query(DocumentMetadata).filter(DocumentMetadata.project_id == project_id).all()

@router.post("/upload")
async def upload_document(project_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")
    
    new_doc = DocumentMetadata(tenant_id=user["tenant_id"], project_id=project_id, filename=file.filename, status="Processing")
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # UPLOAD_DIR = os.path.join(os.getcwd(), 'temp_uploads')
    # os.makedirs(UPLOAD_DIR, exist_ok=True)
    # temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    # with open(temp_path, "wb") as buffer:
    #     shutil.copyfileobj(file.file, buffer)
        
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_KEY", "")
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")
        
    supabase = create_client(supabase_url, supabase_key)
    file_bytes = await file.read()
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    
    supabase.storage.from_("documents").upload(
        path=unique_filename,
        file=file_bytes,
        file_options={"content-type": "application/pdf"}
    )
    
    public_url = supabase.storage.from_("documents").get_public_url(unique_filename)
    
    task = process_and_embed_document_task.delay(public_url, user["tenant_id"], str(new_doc.id))
    return {"status": "Processing", "filename": file.filename, "document_id": new_doc.id, "celery_task_id": task.id}

@router.delete("/{document_id}")
def delete_document(document_id: int, user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    doc = db.query(DocumentMetadata).filter(DocumentMetadata.id == document_id, DocumentMetadata.tenant_id == user["tenant_id"]).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove vectors from Qdrant
    try:
        qdrant.delete(
            collection_name="rfp_chunks",
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="filename",
                        match=MatchValue(value=doc.filename)
                    ),
                    FieldCondition(
                        key="project_id",
                        match=MatchValue(value=str(doc.project_id))
                    )
                ]
            )
        )
    except Exception as e:
        print(f"Error deleting from Qdrant: {e}", flush=True)
        
    # Remove record from PostgreSQL
    db.delete(doc)
    db.commit()
    
    return {"status": "Success", "message": "Document deleted"}

@router.get("/{document_id}/status")
def get_document_status(document_id: int, user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    doc = db.query(DocumentMetadata).filter(DocumentMetadata.id == document_id, DocumentMetadata.tenant_id == user["tenant_id"]).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"status": doc.status}