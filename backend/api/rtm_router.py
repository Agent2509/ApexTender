from fastapi import APIRouter, status
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import tenant_id_context_var
from backend.worker import celery_app

router = APIRouter()

class RTMRequest(BaseModel):
    document_id: str

@router.post("/api/v1/rtm/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_rtm_endpoint(req: RTMRequest):
    # 1. ME REACH INTO SECRET POUCH FOR TENANT TAG
    tenant_id = tenant_id_context_var.get()
    
    # 2. ME YELL AT BEAST TO DO HEAVY THINKING (ASYNC)
    task = celery_app.send_task(
        "backend.services.rtm_generator.generate_rtm_task",
        args=[tenant_id, req.document_id]
    )
    
    # 3. ME RETURN FAST. NO WAIT FOR 2 MINUTE CHAIN.
    return {
        "task_id": task.id, 
        "status": "Accepted", 
        "message": "BEAST IS THINKING ABOUT MATRIX"
    }
