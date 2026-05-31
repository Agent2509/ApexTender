import uuid
from qdrant_client.models import PointStruct
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os

# In production, these come from your .env file
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

def get_qdrant_client() -> QdrantClient:
    """Returns an instance of the Qdrant database client."""
    return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def get_secure_collection_name(tenant_id: str, project_id: str) -> str:
    """
    THE CISO REQUIREMENT: Enforce strict naming conventions.
    Format: rfp_{tenant_uuid}_{project_uuid}
    """
    # Sanitize inputs just to be safe (remove hyphens for cleaner collection names)
    clean_tenant = tenant_id.replace("-", "")
    clean_project = project_id.replace("-", "")
    return f"rfp_{clean_tenant}_{clean_project}"

def init_project_collection(tenant_id: str, project_id: str, vector_size: int = 384):
    """
    Creates an isolated vector collection for a specific project.
    We default to 384 dimensions because that matches the all-MiniLM-L6-v2 
    embedding model specified in your blueprint.
    """
    client = get_qdrant_client()
    collection_name = get_secure_collection_name(tenant_id, project_id)
    
    # Check if collection already exists
    if not client.collection_exists(collection_name):
        print(f"Creating isolated vector collection: {collection_name}")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=vector_size, 
                distance=Distance.COSINE
            ),
        )
        return True
    
    print(f"Collection {collection_name} already exists. Ready for ingestion.")
    return False