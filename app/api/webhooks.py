from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.webhook import WebhookIngestion, WebhookDeliveryStatus
from app.models.webhook import WebhookDelivery, DeliveryAttempt
from app.core.security import verify_signature
from app.tasks.webhook_tasks import process_webhook
from app.core.cache import get_cached_subscription

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/ingest/{subscription_id}", status_code=status.HTTP_202_ACCEPTED)
async def ingest_webhook(
    subscription_id: int,
    webhook: WebhookIngestion,
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db)
):
    # Get subscription from cache or DB
    subscription = get_cached_subscription(subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Check event type filtering
    if subscription.get('event_types') and webhook.event_type not in subscription['event_types']:
        return {"message": "Event type not subscribed"}
    
    # Verify signature if secret is present
    if subscription.get('secret_key'):
        if not x_hub_signature_256:
            raise HTTPException(status_code=400, detail="Signature required")
        if not verify_signature(webhook.payload, subscription['secret_key'], x_hub_signature_256):
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Create webhook delivery record
    delivery = WebhookDelivery(
        subscription_id=subscription_id,
        payload=webhook.payload,
        event_type=webhook.event_type,
        status="PENDING"
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    # Queue the webhook for processing
    process_webhook.delay(delivery.id)
    
    return {"message": "Webhook accepted", "delivery_id": delivery.id}

@router.get("/status/{delivery_id}", response_model=WebhookDeliveryStatus)
async def get_webhook_status(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(WebhookDelivery).filter(WebhookDelivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    attempts = db.query(DeliveryAttempt).filter(
        DeliveryAttempt.delivery_id == delivery_id
    ).all()
    
    return {
        "id": delivery.id,
        "status": delivery.status,
        "attempt_count": delivery.attempt_count,
        "next_retry": delivery.next_retry,
        "attempts": attempts
    }

@router.get("/deliveries/{delivery_id}", response_model=WebhookDeliveryStatus)
async def get_delivery_status(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(WebhookDelivery).filter(
        WebhookDelivery.id == delivery_id
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    attempts = db.query(DeliveryAttempt).filter(
        DeliveryAttempt.delivery_id == delivery_id
    ).all()
    
    return {
        "id": delivery.id,
        "subscription_id": delivery.subscription_id,
        "status": delivery.status,
        "attempt_count": delivery.attempt_count,
        "created_at": delivery.created_at,
        "last_attempt": delivery.last_attempt,
        "attempts": attempts
    }

