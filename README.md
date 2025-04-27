Webhook Delivery Service
A robust webhook delivery system with retry mechanism, delivery tracking, signature verification, event type filtering, and real-time monitoring capabilities.

✨ Features
Subscription Management: Full CRUD operations for webhook subscriptions

Webhook Ingestion: Asynchronous webhook processing with signature verification

Retry Mechanism: Exponential backoff retry strategy (10s, 30s, 1m, 5m, 15m)

Delivery Tracking: Detailed logging for each webhook delivery attempt

Real-time Monitoring: Check delivery status and history

Event Type Filtering: Only deliver events a subscriber is interested in

Caching: Redis-based caching for subscription lookups

Log Retention: Automatic deletion of delivery logs older than 72 hours

⚙️ Tech Stack

Component	Technology
Backend API	FastAPI (Python)
Frontend	React + TypeScript + Vite
Database	PostgreSQL
Task Queue	Celery
Cache/Message Bus	Redis
Containerization	Docker & Docker Compose
Deployment	AWS EC2 (t2.micro)
🏛️ Architecture
FastAPI: Main API server for subscription management and webhook ingestion.

Celery Worker: Handles asynchronous delivery and retry tasks.

Redis: Message broker for Celery and cache for fast subscription lookups.

PostgreSQL: Stores subscriptions and webhook delivery logs.

React Frontend: Manage subscriptions and view delivery attempts.

Docker Compose: One command to bring up the entire stack locally.

🚀 Live URLs

Service	URL
Frontend	http://3.108.68.73:5173
Backend API	http://3.108.68.73:8000
Swagger Docs	http://3.108.68.73:8000/docs
ReDoc Docs	http://3.108.68.73:8000/redoc
OpenAPI Docs	http://3.108.68.73:8000/openapi.json
Health Check	http://3.108.68.73:8000/health

cURL Commands

Create Subscription

  curl --location 'http://3.108.68.73:8000/subscriptions/' \
  --header 'Content-Type: application/json' \
  --data '{
    "target_url": "https://webhook.site/6799e21c-a04f-4b05-b8a2-ebc4efb70aff",
    "secret_key": "Pass123",
    "event_types": [
        "order.created"
    ]
  }'


Trigger Webhook

  curl --location 'http://3.108.68.73:8000/webhooks/ingest/{SUBSCRIPTION_ID}' \
  --header 'Content-Type: application/json' \
  --header 'X-Hub-Signature-256: sha256=`ADD YOUR SHA256 HASH HERE`' \
  --data '{
      
      "payload": {    
          "order_id": "123",
          "amount": 100
      },
      "event_type": "order.created"
  }'

Get Delivery Status

  curl --location 'http://3.108.68.73:8000/webhooks/status/{TASK_ID}'

Get Recent Deliveries

  curl --location 'http://3.108.68.73:8000/subscriptions/{SUBSCRIPTION_ID}/recent-deliveries' 



🛠️ Local Development Setup
Prerequisites

Docker
Docker Compose

Clone the repository


git clone`https://github.com/helloGuyzs/WEBHOOK-SERVICE`
cd WEBHOOK-SERVICE/docker
docker-compose up --build



Access the services
Frontend: http://localhost:5173

Backend API: http://localhost:8000

API Docs (Swagger): http://localhost:8000/docs

📖 API Documentation
1. Subscription Management
Create Subscription:
POST /subscriptions/
Payload:

json
Copy
Edit
{
  "target_url": "https://example.com/webhook",
  "secret": "optional_secret_key",
  "event_types": ["order.created", "user.updated"]
}
List Subscriptions:
GET /subscriptions/

Update Subscription:
PUT /subscriptions/{subscription_id}

Delete Subscription:
DELETE /subscriptions/{subscription_id}

2. Webhook Ingestion
Trigger Webhook:
POST /ingest/{subscription_id}?event_type=order.created Payload:

json
Copy
Edit
{
  "order_id": 1234,
  "amount": 100.0
}
If a secret is configured for the subscription, an X-Hub-Signature-256 header must be included in the request with a valid HMAC SHA256 signature of the payload.

3. Delivery Status & Logs
Get delivery status by task ID:
GET /deliveries/{task_id}

List recent delivery attempts for a subscription:
GET /subscriptions/{subscription_id}/deliveries?limit=20

🛢️ Database Schema
1. subscriptions Table

Column	Type	Description
id	UUID	Unique subscription ID
target_url	TEXT	Target URL for webhook delivery
secret	TEXT	Secret key (optional)
event_types	JSONB	List of event types subscribed
created_at	TIMESTAMP	Created timestamp
2. deliveries Table

Column	Type	Description
id	UUID	Delivery attempt ID
subscription_id	UUID	Linked subscription
payload	JSONB	Original payload
target_url	TEXT	Target URL
attempt_number	INT	Attempt number (1, 2, etc.)
status	TEXT	Success / Failed Attempt / Failure
http_status	INT	HTTP Status received (if any)
error_message	TEXT	Error details
created_at	TIMESTAMP	Attempt timestamp
archived_at	TIMESTAMP	If deleted after retention policy
🧹 Log Retention Policy
Delivery logs older than 72 hours are automatically deleted using a periodic background task scheduled via Celery beat or custom cron job.

🔁 Retry Mechanism
Strategy: Exponential backoff

Schedule: 10s → 30s → 1m → 5m → 15m

Max Retries: 5 attempts

Failure Handling: Mark the task as permanently failed after 5 unsuccessful tries.

🧠 Caching
Subscription details are cached in Redis after the first database lookup.

Cached details expire after a configurable TTL (default: 10 minutes).

💵 Cost Estimation (AWS Free Tier)

Resource	Usage Details	Monthly Cost
EC2 (t2.micro)	Hosting Docker containers (Free 12 months)	$0
RDS (PostgreSQL)	db.t3.micro, 20GB storage (Free 12 months)	$0
ElastiCache (Redis)	Cache layer (~cache.t2.micro) (~15GB)	~$15
EBS Storage	30GB General Purpose SSD (gp2)	~$3
Approximate Monthly Cost: $18 after 12 months
(First 12 months can be almost free with AWS Free Tier if used carefully.)

📋 Assumptions
Each subscription can optionally define event types they care about.

Secret-based signature verification is optional per subscription.

All retries are handled asynchronously to avoid blocking API responses.

Deliveries that fail all retries are recorded permanently with failure status.

Only POST method supported for webhook deliveries.

Retention period can be configured via environment variables.

📚 Sample curl Commands
Create a subscription
bash
Copy
Edit
curl -X POST http://localhost:8000/subscriptions/ \
-H "Content-Type: application/json" \
-d '{"target_url": "https://webhook.site/your-url", "secret": "mysecret", "event_types": ["order.created", "user.updated"]}'
Ingest a webhook
bash
Copy
Edit
curl -X POST http://localhost:8000/ingest/{subscription_id}?event_type=order.created \
-H "Content-Type: application/json" \
-H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
-d '{"order_id":123, "amount":100}'
Check delivery status
bash
Copy
Edit
curl http://localhost:8000/deliveries/{task_id}
🛡️ Credits
FastAPI: https://fastapi.tiangolo.com/

Celery: https://docs.celeryq.dev/

Docker: https://docs.docker.com/

Redis: https://redis.io/

Vite: https://vitejs.dev/

✅ Conclusion
This project ensures reliable webhook deliveries with retries, monitoring, and filtering. The system is highly scalable, Dockerized, cloud-deployable, and provides a minimal but functional frontend UI for interaction and management.
