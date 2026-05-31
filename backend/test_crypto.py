import os
from utils.encryption import derive_tenant_key, encrypt_file, decrypt_file

def run_test():
    print("--- Starting AES-256-GCM Verification ---")
    
    # 1. Simulate a master key (in production, this comes from Docker Secrets)
    master_key = os.urandom(32) 
    tenant_id = "tenant-123-uuid"
    
    print(f"1. Generating unique cryptographic key for {tenant_id}...")
    tenant_key = derive_tenant_key(master_key, tenant_id)
    
    # 2. Simulate a confidential government bid document
    original_document = b"CONFIDENTIAL: Project NEOM Bid Pricing - $45,000,000"
    print(f"2. Original text: {original_document.decode()}")
    
    # 3. Encrypt the document
    print("3. Encrypting document...")
    nonce, ciphertext = encrypt_file(original_document, tenant_key)
    
    # We print the hex representation so you can visually see it is unreadable gibberish
    print(f"   -> Ciphertext (Hex): {ciphertext.hex()[:50]}...[TRUNCATED]") 
    
    # 4. Decrypt the document
    print("4. Decrypting document...")
    decrypted_document = decrypt_file(nonce, ciphertext, tenant_key)
    print(f"   -> Decrypted text: {decrypted_document.decode()}")
    
    # 5. Cryptographic assertion
    if original_document == decrypted_document:
        print("\nSUCCESS: Encryption engine is locked and operational!")
    else:
        print("\nFAILURE: Decrypted text does not match original.")

if __name__ == "__main__":
    run_test()