from fastapi import APIRouter, HTTPException, status
from celery.result import AsyncResult
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import tenant_id_context_var
from worker import celery_app

router = APIRouter()

@router.get("/api/v1/tasks/{task_id}", status_code=status.HTTP_200_OK)
async def get_task_status(task_id: str):
    tenant_id = tenant_id_context_var.get()
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid authentication token.")

    task_result = AsyncResult(task_id, app=celery_app)

    response_data = {
        "task_id": task_id,
        "status": task_result.state,
        "result": None
    }

    if task_result.state == 'SUCCESS':
        response_data["result"] = task_result.result
    elif task_result.state == 'FAILURE':
        response_data["error"] = str(task_result.info)

    return response_data
