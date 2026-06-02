import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, status

# IMPORT SECRET POUCH FROM OUTSIDE CAVE
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import tenant_id_context_var
from backend.worker import process_document_task

router = APIRouter()

TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_document(file: UploadFile = File(...)):
    # GRAB TENANT ID
    tenant_id = tenant_id_context_var.get()
    
    # MAKE WEIRD NAME FOR FILE
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    temp_path = os.path.join(TEMP_DIR, unique_filename)
    
    # DRIP WATER, NOT FLOOD (OOM SAFE)
    async with aiofiles.open(temp_path, 'wb') as out_file:
        while chunk := await file.read(1024 * 1024):  # 1MB BITES
            await out_file.write(chunk)
            
    # WAKE UP CELERY BEAST
    task = process_document_task.delay(temp_path, tenant_id)
    
    return {"task_id": task.id, "status": "Accepted", "message": "WORKER BEAST HAS ROCK"}
