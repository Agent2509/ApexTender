from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
import uuid

# ABSOLUTE IMPORTS ONLY
from api.dependencies import get_current_user_token
from database import get_db, DocumentMetadata
from worker import process_pdf_task
from utils.retrieval import qdrant
from qdrant_client.models import Filter, FieldCondition, MatchValue

router = APIRouter()

@router.get("/")
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

    UPLOAD_DIR = os.path.join(os.getcwd(), 'temp_uploads')
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    process_pdf_task.delay(new_doc.id, temp_path)
    return {"status": "Processing", "filename": file.filename}

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