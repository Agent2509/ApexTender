import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, MatchValue
import uuid
from google import genai

# 1. Initialize Qdrant and the Embedding Model
qdrant = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

def get_embedding(text: str) -> list[float]:
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={
            "task_type": "RETRIEVAL_DOCUMENT",
            "output_dimensionality": 768
        }
    )
    return result.embeddings[0].values

def get_query_embedding(text: str) -> list[float]:
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={
            "task_type": "RETRIEVAL_QUERY",
            "output_dimensionality": 768
        }
    )
    return result.embeddings[0].values

def ensure_collection(collection_name: str):
    """Creates the collection if it doesn't exist."""
    if not qdrant.collection_exists(collection_name):
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )

def search_documents(tenant_id: str, project_id: str, question: str, limit: int = 3):
    """
    Takes a user question, converts it to a vector, and finds the closest matching text chunks.
    """
    collection_name = "rfp_chunks"
    
    # 1. Convert the question into a vector
    query_vector = get_query_embedding(question)
    
    # 2. Make sure the collection exists so we don't crash if it's empty
    ensure_collection(collection_name)
    
    # 3. Perform the semantic search using the compatible v1.9 API
    results = qdrant.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="project_id",
                    match=MatchValue(value=str(project_id))
                )
            ]
        ),
        limit=limit  # Grab the top 3 most relevant chunks
    )
    
    # 4. Extract the actual text from the payload
    context_chunks = []
    for hit in results:
        if hit.payload:
            context_chunks.append({
                "text": hit.payload.get("text", ""),
                "filename": hit.payload.get("filename", "unknown"),
                "score": hit.score
            })
    
    return context_chunks

def ingest_text(tenant_id: str, project_id: str, text: str, filename: str):
    """
    Chunks raw text, embeds it, and stores it securely in the tenant's Qdrant collection.
    """
    collection_name = "rfp_chunks"
    ensure_collection(collection_name)
    
    # Simple chunking strategy: 1000 characters with a 200 character overlap
    chunks = []
    chunk_size = 1000
    overlap = 200
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
        
    points = []
    for i, chunk in enumerate(chunks):
        if not chunk.strip(): continue
        
        # Convert the text chunk into a 768-dimensional vector
        vector = get_embedding(chunk)
        
        # Prepare the data point for Qdrant
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": chunk, 
                "filename": filename, 
                "chunk_index": i,
                "project_id": str(project_id),
                "tenant_id": str(tenant_id)
            }
        ))
        
    # Upsert all chunks into the vector database
    if points:
        qdrant.upsert(collection_name=collection_name, points=points)
    
    return len(points)