import hmac
import hashlib

def verify_signature(payload: dict, secret_key: str, signature: str) -> bool:
    """
    Verify webhook signature using HMAC-SHA256
    """
    if not signature.startswith("sha256="):
        return False
    
    expected_signature = signature.split("=")[1]
    
    # Convert payload to bytes
    payload_bytes = str(payload).encode('utf-8')
    
    # Calculate HMAC
    hmac_obj = hmac.new(
        secret_key.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    )
    calculated_signature = hmac_obj.hexdigest()
    
    return hmac.compare_digest(calculated_signature, expected_signature)