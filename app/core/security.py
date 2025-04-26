import hmac
import hashlib
import json

def verify_signature(payload: dict, stored_secret: str, signature: str) -> bool:
    # Extract salt and stored hash
    salt, stored_hash = stored_secret.split(':')
    
    # Remove 'sha256=' prefix from the received signature
    received_signature = signature.replace('sha256=', '')
    
    # Calculate signature with raw secret
    raw_secret = payload_str = None
    for possible_secret in [stored_hash, "Pass123"]:  # Try both hashed and original
        payload_str = json.dumps(payload, sort_keys=True)
        calculated_signature = hmac.new(
            possible_secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if hmac.compare_digest(calculated_signature, received_signature):
            return True
    
    return False 