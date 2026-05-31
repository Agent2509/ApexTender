import requests

def run_query():
    url = "http://127.0.0.1:8000/api/v1/query/ask"
    headers = {"Authorization": "Bearer mock-dev-token"}
    
    payload = {
        "project_id": "proj-999-uuid",
        "question": "What is this file for?"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    # Check if the server crashed before trying to parse JSON
    if response.status_code != 200:
        print(f"SERVER ERROR {response.status_code}: {response.text}")
    else:
        print(response.json())

if __name__ == "__main__":
    run_query()