from utils.vector_store import init_project_collection, get_secure_collection_name, get_qdrant_client

def run_test():
    tenant_id = "tenant-123-uuid"
    project_id = "proj-999-uuid"
    
    expected_name = get_secure_collection_name(tenant_id, project_id)
    print(f"--- 1. Expected Secure Collection Name: {expected_name} ---")
    
    print("\n--- 2. Connecting to Qdrant and Initializing... ---")
    try:
        # This will create the collection inside your local Docker Qdrant container
        init_project_collection(tenant_id, project_id)
        
        # Verify it actually exists in the database
        client = get_qdrant_client()
        collections = client.get_collections().collections
        names = [c.name for c in collections]
        
        if expected_name in names:
            print(f"\nSUCCESS: AI Memory partitioned! {expected_name} is active.")
        else:
            print("\nFAILURE: Collection was not found in Qdrant.")
            
    except Exception as e:
        print(f"\nERROR: Could not connect to Qdrant. Is your Docker container running?\nDetails: {e}")

if __name__ == "__main__":
    run_test()