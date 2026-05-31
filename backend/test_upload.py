import requests

def run_test():
    url = "http://127.0.0.1:8000/api/v1/documents/upload"
    
    headers = {"Authorization": "Bearer mock-dev-token"}
    
    with open("dummy_bid.pdf", "rb") as f:
        files = {"file": ("dummy_bid.pdf", f, "application/pdf")}
        
        print("--- Sending File to Secure Upload Endpoint ---")
        response = requests.post(url, headers=headers, files=files)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    run_test()