import os
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

try:
    search_results = client.query_points(
        collection_name="rfp_chunks",
        query=[0.0] * 768,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="project_id",
                    match=MatchValue(value="test")
                )
            ]
        ),
        limit=5
    )
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
