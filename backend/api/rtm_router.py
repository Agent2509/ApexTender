from fastapi import APIRouter, status
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import tenant_id_context_var
from worker import celery_app

router = APIRouter()

class RTMRequest(BaseModel):
    document_id: str

@router.post("/api/v1/rtm/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_rtm_endpoint(req: RTMRequest):
    # 1. Extract tenant ID from request context
    tenant_id = tenant_id_context_var.get()
    
    # 2. Dispatch asynchronous RTM generation task
    task = celery_app.send_task(
        "backend.services.rtm_generator.generate_rtm_task",
        args=[tenant_id, req.document_id]
    )
    
    # 3. Return accepted status immediately.
    return {
        "task_id": task.id, 
        "status": "Accepted", 
        "message": "Task successfully queued for processing."
    }
