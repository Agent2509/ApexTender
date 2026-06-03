import os
from qdrant_client import QdrantClient
from qdrant_client.http import models

class QdrantManager:
    def __init__(self):
        # QDRANT CLOUD CONNECTION
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            api_key=os.getenv("QDRANT_API_KEY", "dummy_key")
        )
        self.collection_name = "rfp_knowledge"
        
    def init_collection(self):
        """ME MAKE HOLE FOR ARROWS (VECTORS) WITH MAGIC SQUEEZE (BINARY QUANTIZATION)"""
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=768,
                    distance=models.Distance.COSINE
                ),
                quantization_config=models.BinaryQuantization(
                    binary=models.BinaryQuantizationConfig(always_ram=True)
                )
            )
            
    def secure_upsert(self, tenant_id: str, points: list[models.PointStruct]):
        """ME PUT TENANT TAG ON ALL ARROWS. FAIL SAFE. NO CROSS TENANT."""
        for point in points:
            if point.payload is None:
                point.payload = {}
            # FORCED TENANT TAG
            point.payload["tenant_id"] = tenant_id
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        
    def secure_search(self, tenant_id: str, query_vector: list[float], limit: int = 5):
        """ME ONLY FIND ARROWS WITH RIGHT TENANT TAG. ISOLATED SEARCH."""
        tenant_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="tenant_id",
                    match=models.MatchValue(value=tenant_id)
                )
            ]
        )
        
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=tenant_filter,
            limit=limit
        )
