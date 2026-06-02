import time
import requests
import os
import logging
import json

# ME SET UP LOUD YELLING SO WE CAN HEAR BEAST
logging.basicConfig(level=logging.INFO, format="%(asctime)s - [CAVE SENSOR] - %(message)s")

BASE_URL = "http://localhost:8000"
HEADERS = {"X-Tenant-ID": "test-cave-tenant-123"}
PROMO_CODE = "FAIZAN_ZERO_2026"
# ROCK IS IN MAIN CAVE
PDF_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dummy_bid.pdf")

def run_e2e_hunt():
    logging.info("=========================================")
    logging.info("   STARTING THE GRAND HUNT (E2E TEST)    ")
    logging.info("=========================================\n")
    
    # ---------------------------------------------------------
    # PHASE 1: GOD MODE ACTIVATION (PROMO SYSTEM)
    # ---------------------------------------------------------
    logging.info(f"PHASE 1: REDEEMING MAGIC STICK '{PROMO_CODE}'...")
    try:
        resp = requests.post(f"{BASE_URL}/api/v1/billing/redeem", headers=HEADERS, json={"promo_code": PROMO_CODE})
        if resp.status_code == 200:
            logging.info(f"SUCCESS -> BEAST SAYS: {resp.json().get('message')}\n")
        else:
            logging.error(f"FAILURE -> BEAST ANGRY: {resp.text}\n")
    except requests.exceptions.ConnectionError:
        logging.error("CAVE DOOR CLOSED. IS FASTAPI RUNNING ON PORT 8000?\n")
        return
    except Exception as e:
        logging.error(f"CAVE QUAKE: {e}\n")
        
    # ---------------------------------------------------------
    # PHASE 2: UPLOAD ROCK & ASYNC POLLING
    # ---------------------------------------------------------
    logging.info("PHASE 2: FEEDING ROCK TO BEAST (UPLOAD PDF)...")
    if not os.path.exists(PDF_PATH):
        logging.warning(f"ME NO FIND {PDF_PATH}! ME MAKE FAKE ROCK TO THROW SO TEST NOT CRASH.")
        with open(PDF_PATH, "wb") as f:
            f.write(b"dummy pdf content for testing beast")
            
    document_id = "dummy-doc-id-123" # FALLBACK
    try:
        with open(PDF_PATH, "rb") as f:
            files = {"file": ("dummy_bid.pdf", f, "application/pdf")}
            # NOTE: WE USED /upload IN BLOCK 2
            upload_resp = requests.post(f"{BASE_URL}/upload", headers=HEADERS, files=files)
            upload_resp.raise_for_status()
            
            task_id = upload_resp.json().get("task_id")
            logging.info(f"BEAST HAS ROCK. TASK ID: {task_id}")
            
        # THE POLLING LOOP (AMETHYST SKELETON UI SIMULATOR)
        while True:
            time.sleep(3)
            status_resp = requests.get(f"{BASE_URL}/api/v1/tasks/{task_id}", headers=HEADERS)
            
            if not status_resp.ok:
                logging.error(f"STATUS PEEK FAILED: {status_resp.text}")
                break
                
            data = status_resp.json()
            state = data.get("status")
            logging.info(f"[GLOWING AMETHYST SKELETON] BEAST IS: {state}")
            
            if state == "SUCCESS":
                logging.info("SUCCESS -> BEAST CHEWED ROCK AND PUT ARROWS IN QDRANT HOLE!\n")
                result_data = data.get("result") or {}
                if isinstance(result_data, dict) and result_data.get("document_id"):
                    document_id = result_data.get("document_id")
                break
            elif state == "FAILURE":
                logging.error("FAILURE -> BEAST CHOKED ON ROCK!\n")
                break
                
    except Exception as e:
        logging.error(f"UPLOAD PHASE FAILED: {e}\n")
        return

    # ---------------------------------------------------------
    # PHASE 3: THE RTM GENERATION (THE AI BRAIN)
    # ---------------------------------------------------------
    logging.info(f"PHASE 3: WAKING UP SKY BRAIN FOR RTM (DOCUMENT ID: {document_id})...")
    try:
        rtm_req = {"document_id": document_id}
        rtm_resp = requests.post(f"{BASE_URL}/api/v1/rtm/generate", headers=HEADERS, json=rtm_req)
        rtm_resp.raise_for_status()
        
        rtm_task_id = rtm_resp.json().get("task_id")
        logging.info(f"SKY BRAIN IS THINKING. TASK ID: {rtm_task_id}")
        
        # THE POLLING LOOP FOR LLM
        while True:
            time.sleep(3)
            status_resp = requests.get(f"{BASE_URL}/api/v1/tasks/{rtm_task_id}", headers=HEADERS)
            
            if not status_resp.ok:
                logging.error(f"STATUS PEEK FAILED: {status_resp.text}")
                break
                
            data = status_resp.json()
            state = data.get("status")
            logging.info(f"[PULSING OBSIDIAN SKELETON] SKY BRAIN IS: {state}")
            
            if state == "SUCCESS":
                logging.info("SUCCESS -> SKY BRAIN CONTRACT BOX RETURNED MATRIX!")
                
                matrix = data.get("result", {})
                # HANDLE BOTH STRINGIFIED JSON OR NATIVE DICT FROM CELERY
                if isinstance(matrix, str):
                    try:
                        matrix = json.loads(matrix)
                    except:
                        matrix = {"rows": []}
                        
                rows = matrix.get("rows", [])
                
                if not rows:
                    logging.info("MATRIX IS EMPTY! NO RULES FOUND OR SKY BRAIN DUMB.")
                else:
                    for i, row in enumerate(rows):
                        logging.info(f"\n--- REQUIREMENT {row.get('requirement_id', i+1)} ---")
                        logging.info(f"STATUS:      {row.get('compliance_status')}")
                        logging.info(f"REASONING:   {row.get('reasoning_path')}")
                        logging.info(f"QUOTE:       '{row.get('source_quote')}'")
                print("\n")
                break
                
            elif state == "FAILURE":
                logging.error("FAILURE -> SKY BRAIN BROKE CONTRACT OR CAUGHT ON FIRE!\n")
                break
                
    except Exception as e:
        logging.error(f"RTM PHASE FAILED: {e}\n")
        
    logging.info("=========================================")
    logging.info("         THE GRAND HUNT IS OVER          ")
    logging.info("=========================================")

if __name__ == "__main__":
    run_e2e_hunt()
