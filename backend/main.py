from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.documents import router as documents_router
from api.query import router as query_router
from api.projects import router as projects_router
from api.billing import router as billing_router

from api.router import router as upload_router
from api.rtm_router import router as rtm_router
from api.status_router import router as status_router
from api.billing_router import router as new_billing_router
from database import init_db
import os
import uvicorn
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance
from qdrant_client.http import models
from contextlib import asynccontextmanager
import re

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        if not client.collection_exists("rfp_chunks"):
            client.create_collection(
                collection_name="rfp_chunks",
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            print("--- Created Qdrant collection 'rfp_chunks' ---")
            
        try:
            client.create_payload_index(
                collection_name="rfp_chunks",
                field_name="project_id",
                field_schema=models.PayloadSchemaType.KEYWORD
            )
        except Exception:
            pass
        try:
            client.create_payload_index(
                collection_name="rfp_chunks",
                field_name="tenant_id",
                field_schema=models.PayloadSchemaType.KEYWORD
            )
        except Exception:
            pass
        try:
            client.create_payload_index(
                collection_name="rfp_chunks",
                field_name="filename",
                field_schema=models.PayloadSchemaType.KEYWORD
            )
        except Exception:
            pass
    except Exception as e:
        print(f"--- Qdrant initialization failed: {e} ---")
    yield

app = FastAPI(title="Enterprise RFP API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_origins=[
        "http://localhost:3000",
        "https://apextender.vercel.app"
    ] + ([os.getenv("FRONTEND_URL")] if os.getenv("FRONTEND_URL") else []),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.head("/")
async def root_health_check():
    return {"status": "Command Fortress Online", "version": "1.0.0"}

app.include_router(projects_router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(query_router, prefix="/api/v1/query", tags=["Query"])
app.include_router(billing_router, prefix="/api/v1/billing", tags=["Billing"])

app.include_router(upload_router, tags=["Upload"])
app.include_router(rtm_router, tags=["RTM"])
app.include_router(status_router, tags=["Status"])
app.include_router(new_billing_router, tags=["New Billing"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# OLD TASK STATUS REMOVED

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)