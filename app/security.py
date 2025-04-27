import hmac
import hashlib
import json

def generate_direct_signature(payload: dict, secret_key: str) -> str:
    """
    Generate a signature exactly matching the frontend implementation
    with no string manipulation
    """
    # Convert payload to a JSON string with no extra formatting
    payload_str = json.dumps(payload, separators=(',', ':'))
    
    # Calculate HMAC
    signature = hmac.new(
        secret_key.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return signature

def verify_signature(payload: dict, secret_key: str, signature: str) -> bool:
    """
    Verify webhook signature using HMAC-SHA256
    """
    if signature.startswith("sha256="):
        expected_signature = signature.split("=")[1]
    else:
        expected_signature = signature
    
    # Calculate signature using our direct method
    calculated_signature = generate_direct_signature(payload, secret_key)
    
    # Compare signatures
    return hmac.compare_digest(calculated_signature, expected_signature)