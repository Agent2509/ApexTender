import requests

def run_test():
    url = "http://127.0.0.1:8000/api/v1/projects"
    
    print("--- 1. Testing without a token (Should be blocked) ---")
    bad_response = requests.get(url)
    print(f"Status Code: {bad_response.status_code}")
    print(f"Response: {bad_response.json()}\n")
    
    print("--- 2. Testing with valid token (Should pass middleware) ---")
    headers = {"Authorization": "Bearer mock-dev-token"}
    good_response = requests.get(url, headers=headers)
    print(f"Status Code: {good_response.status_code}")
    print(f"Response: {good_response.json()}")

if __name__ == "__main__":
    run_test()