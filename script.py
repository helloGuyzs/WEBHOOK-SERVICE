# import hmac
# import hashlib
# import json

# # Your webhook payload - EXACTLY as in the cURL request
# webhook_data = {
#   "payload": {
#     "notificationType": "DATA_FETCH_SUCCESS",
#     "accounts": [
#         {
#             "maskedAccountNumber": "XXXX6945",
#             "linkRefNumber": "d6740d13-22d6-410a-93e9-6f065c5aa0da",
#             "fipName": "BANK OF BARODA",
#             "fipId": "BARBFIP",
#             "fiType": "DEPOSIT",
#             "accountType": "SAVINGS",
#             "referenceId": "1529cc4a-8d62-49c6-8d13-f861de98088f",
#             "vuaId": "8141170116@onemoney",
#             "latestDataRequest": {
#                 "fromDate": "2024-04-27T08:58:45.930Z",
#                 "toDate": "2025-04-27T08:58:45.930Z",
#                 "status": "DELIVERED",
#                 "sessionId": "4f03f8ba-bee4-4dc5-b64f-5b7d69fbb3dc"
#             },
#             "isHistoricalData": False
#         }
#     ],
#     "consentStatus": "ACTIVE",
#     "dataFetchStatus": "COMPLETED",
#     "status": "PROCESSING",
#     "trackingId": "4feb3e26-ca4a-4584-a483-cebb064ae660",
#     "referenceId": "1529cc4a-8d62-49c6-8d13-f861de98088f",
#     "consentHandle": "1529cc4a-8d62-49c6-8d13-f861de98088f",
#     "consentId": "47a110e2-3a2c-49da-bb50-992160df15e6",
#     "autoPullFIRequest": False,
#     "sessionId": "4f03f8ba-bee4-4dc5-b64f-5b7d69fbb3dc",
#     "dataDetails": {
#         "sessionId": "4f03f8ba-bee4-4dc5-b64f-5b7d69fbb3dc",
#         "isDataAvailable": True,
#         "dataRange": {
#             "fromDate": "2024-04-27T08:58:45.930Z",
#             "toDate": "2025-04-27T08:58:45.930Z"
#         },
#         "accounts": [
#             {
#                 "fipName": "BANK OF BARODA",
#                 "fipId": "BARBFIP",
#                 "fiType": "DEPOSIT",
#                 "fiStatus": "DELIVERED",
#                 "accountNumber": "XXXX6945",
#                 "linkRefNumber": "d6740d13-22d6-410a-93e9-6f065c5aa0da",
#                 "isDataAvailable": True
#             }
#         ]
#     },
#     "consentStateChanged": False
# },
#   "event_type": "order.created"
# }

# # Your secret key - same as used in subscription creation
# secret_key = "Pass123"

# # Generate signature using the inner payload
# payload_str = json.dumps(webhook_data["payload"], sort_keys=True)
# print("Payload being signed:", payload_str)

# signature = hmac.new(
#     secret_key.encode('utf-8'),
#     payload_str.encode('utf-8'),
#     hashlib.sha256
# ).hexdigest()

# print(f"X-Hub-Signature-256: sha256={signature}")

from app.core.security import generate_direct_signature

test_payload = {
"testing":"heelolooo"
}
test_secret = "Pass123"
print(test_payload)

print(generate_direct_signature(test_payload, test_secret))