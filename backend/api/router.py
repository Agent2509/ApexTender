import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Depends, status

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import tenant_id_context_var
from worker import process_and_embed_document_task
from api.dependencies import get_current_user_token

router = APIRouter()

TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_document(file: UploadFile = File(...), user: dict = Depends(get_current_user_token)):
    tenant_id = user.get("sub", tenant_id_context_var.get())

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    temp_path = os.path.join(TEMP_DIR, unique_filename)

    async with aiofiles.open(temp_path, 'wb') as out_file:
        while chunk := await file.read(1024 * 1024):
            await out_file.write(chunk)

    task = process_and_embed_document_task.delay(temp_path, tenant_id, "")

    return {"task_id": task.id, "status": "processing", "message": "Upload initiated successfully"}
