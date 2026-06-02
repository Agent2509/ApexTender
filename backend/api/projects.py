from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from api.dependencies import get_current_user_token
from database import get_db, Project

router = APIRouter()

from typing import Optional, List, Dict

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

@router.get("/")
def list_projects(user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.tenant_id == user["tenant_id"]).all()

@router.post("/")
def create_project(project: ProjectCreate, user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    new_project = Project(
        id=str(uuid.uuid4()),
        tenant_id=user["tenant_id"],
        name=project.name,
        description=project.description
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

from fastapi import UploadFile, File
import os
import shutil
from database import DocumentMetadata
from worker import process_pdf_task

@router.post("/{project_id}/documents")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")
        
    proj = db.query(Project).filter(Project.id == project_id, Project.tenant_id == user["tenant_id"]).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    new_doc = DocumentMetadata(
        tenant_id=user["tenant_id"],
        project_id=project_id,
        filename=file.filename,
        status="processing"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    os.makedirs("./uploads/", exist_ok=True)
    temp_path = f"./uploads/{uuid.uuid4()}_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    task = process_pdf_task.delay(new_doc.id, temp_path)
    
    return {"status": "success", "document_id": new_doc.id, "celery_task_id": task.id}

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
import google.generativeai as genai

qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")

if not qdrant_url or not qdrant_api_key:
    print("WARNING: QDRANT_URL or QDRANT_API_KEY environment variables are missing! Qdrant connection will fail.", flush=True)

qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

def get_query_vector(query: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=query,
        task_type="retrieval_query",
        output_dimensionality=768,
    )
    return result['embedding']

class SearchQuery(BaseModel):
    query: str
    limit: int = 5
    history: List[Dict[str, str]] = []

import os
import httpx

import json
from fastapi.responses import StreamingResponse

@router.post("/{project_id}/search")
async def search_documents(
    project_id: str,
    search_query: SearchQuery,
    user: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id, Project.tenant_id == user["tenant_id"]).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    query_vector = get_query_vector(search_query.query)

    try:
        search_results = qdrant_client.search(
            collection_name="rfp_chunks",
            query_vector=query_vector,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key="project_id",
                        match=MatchValue(value=str(project_id))
                    )
                ]
            ),
            limit=search_query.limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = []
    context_text = ""
    for hit in search_results:
        chunk = hit.payload.get("chunk_text", "")
        filename = hit.payload.get("filename", "unknown")
        page_number = hit.payload.get("page_number", None)
        # Build a short snippet (first 200 chars) for citation display
        snippet = chunk[:200].strip() + ("..." if len(chunk) > 200 else "")
        sources.append({
            "chunk_text": chunk,
            "filename": filename,
            "page_number": page_number,
            "snippet": snippet,
            "document_id": hit.payload.get("document_id"),
            "similarity_score": hit.score
        })
        context_text += f"\n---\nSource: {filename} (Page {page_number})\n{chunk}"

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set in environment")

    system_prompt = (
        "You are ApexTender, a Senior RFP Proposal Analyst. Your job is to analyze Request for Proposal (RFP) documents and provide highly accurate, concise, and structured answers to help your team win government and enterprise contracts.\n"
        "Rules:\n"
        "1. Only use the provided context. If the answer is not in the context, explicitly say: 'That information is not available in the provided documents.' Do not guess.\n"
        "2. Use professional, assertive business language.\n"
        "3. Format your answers clearly using bullet points and bold text for key terms."
    )
    user_prompt = f"Context from retrieved documents:{context_text}\n\nQuestion: {search_query.query}"

    # Build multi-turn messages: system → history → current user (with context)
    messages = [{"role": "system", "content": system_prompt}]
    print(f"Received history: {search_query.history}", flush=True)
    print(f"[SEARCH] Received history with {len(search_query.history)} messages", flush=True)
    for msg in search_query.history:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_prompt})
    print(f"[SEARCH] Sending {len(messages)} total messages to Groq (1 system + {len(messages)-2} history + 1 current)")
    
    async def generate_stream():
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": messages,
                        "stream": True
                    },
                    timeout=30.0
                ) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        yield f"data: {json.dumps({'type': 'error', 'text': f'Groq API Error: {err_text.decode()}'})}\n\n"
                        return
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                data_json = json.loads(data_str)
                                content = data_json["choices"][0].get("delta", {}).get("content", "")
                                if content:
                                    yield f"data: {json.dumps({'type': 'chunk', 'text': content})}\n\n"
                            except Exception:
                                pass
            
            # Send sources at the very end
            yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"
            
        except Exception as e:
            print(f"LLM Stream Error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'text': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

# --- Word Document Export ---
import io
from fastapi.responses import Response
from docx import Document as DocxDocument
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

class ExportRequest(BaseModel):
    content: str

@router.post("/{project_id}/export")
async def export_document(
    project_id: str,
    export_req: ExportRequest,
    user: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id, Project.tenant_id == user["tenant_id"]).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    doc = DocxDocument()

    # Style the title
    title = doc.add_heading("RFP Generation", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title.runs:
        run.font.color.rgb = RGBColor(30, 64, 175)

    # Add project name as subtitle
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run(f"Project: {proj.name}")
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph("")  # spacer

    # Add the AI-generated content
    doc.add_heading("AI-Generated Response", level=1)
    for paragraph_text in export_req.content.split("\n"):
        if paragraph_text.strip():
            p = doc.add_paragraph(paragraph_text)
            for run in p.runs:
                run.font.size = Pt(11)

    # Write to in-memory buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": "attachment; filename=Generated_Response.docx"
        }
    )

@router.delete("/{project_id}")
def delete_project(project_id: str, user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id, Project.tenant_id == user["tenant_id"]).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    documents = db.query(DocumentMetadata).filter(DocumentMetadata.project_id == project_id).all()
    for doc in documents:
        try:
            qdrant_client.delete(
                collection_name="rfp_chunks",
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="filename",
                            match=MatchValue(value=doc.filename)
                        ),
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=str(project_id))
                        )
                    ]
                )
            )
        except Exception as e:
            print(f"Error deleting vectors from Qdrant: {e}", flush=True)
            
        db.delete(doc)
        
    db.delete(proj)
    db.commit()
    return {"status": "Success", "message": "Project deleted"}
