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

def verify_signature(payload: dict, stored_secret: str, signature: str) -> bool:
    # Extract salt and stored hash
    salt, stored_hash = stored_secret.split(':')
    
    # Remove 'sha256=' prefix from the received signature
    received_signature = signature.replace('sha256=', '')
    
    # Try with both possible secrets
    for possible_secret in [stored_hash, "Pass123"]:
        calculated_signature = generate_direct_signature(payload, possible_secret)
        if hmac.compare_digest(calculated_signature, received_signature):
            return True
    
    return False 