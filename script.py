import hmac
import hashlib
import json

# Your webhook payload - EXACTLY as in the cURL request
webhook_data = {
    "payload": {
        "event": "order.created",
        "data": {
            "order_id": "123",
            "amount": 100
        }
    },
    "event_type": "order.created"
}

# Your secret key - same as used in subscription creation
secret_key = "Pass123"

# Generate signature using the inner payload
payload_str = json.dumps(webhook_data["payload"], sort_keys=True)
print("Payload being signed:", payload_str)

signature = hmac.new(
    secret_key.encode('utf-8'),
    payload_str.encode('utf-8'),
    hashlib.sha256
).hexdigest()

print(f"X-Hub-Signature-256: sha256={signature}")