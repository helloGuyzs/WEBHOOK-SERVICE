from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import subscriptions, webhooks
from app.core.db_init import init_db
import time
import logging

logger = logging.getLogger(__name__)

# Initialize database with retries
max_attempts = 5
for attempt in range(max_attempts):
    logger.info(f"Initializing database (attempt {attempt+1}/{max_attempts})...")
    if init_db():
        logger.info("Database initialization successful")
        break
    if attempt < max_attempts - 1:  # Don't sleep on the last attempt
        time.sleep(10)

app = FastAPI(
    title="Webhook Delivery Service",
    description="A robust webhook delivery service with retry mechanism and delivery tracking",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(subscriptions.router)
app.include_router(webhooks.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Webhook Delivery Service",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 