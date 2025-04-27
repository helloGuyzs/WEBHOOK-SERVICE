from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.webhook import WebhookIngestion, WebhookDeliveryStatus
from app.models.webhook import WebhookDelivery, DeliveryAttempt
from app.models.subscription import Subscription as SubscriptionModel
from app.core.security import verify_signature
from app.tasks.webhook_tasks import process_webhook
from app.core.cache import get_cached_subscription, cache_subscription

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

def get_subscription_from_db(subscription_id: int, db: Session):
    """Get subscription from database and return as dict"""
    db_subscription = db.query(SubscriptionModel).filter(
        SubscriptionModel.id == subscription_id,
        SubscriptionModel.is_active == True
    ).first()
    
    if not db_subscription:
        return None
    
    # Cache the subscription for future use
    cache_subscription(db_subscription)
    
    # Convert DB model to dict for consistent usage
    return {
        "id": db_subscription.id,
        "target_url": str(db_subscription.target_url),
        "event_types": db_subscription.event_types,
        "is_active": db_subscription.is_active,
        "secret_key": db_subscription.secret_key
    }

@router.post("/ingest/{subscription_id}", status_code=status.HTTP_202_ACCEPTED)
async def ingest_webhook(
    subscription_id: int,
    webhook: WebhookIngestion,
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db)
):
    # Get subscription from cache
    subscription = get_cached_subscription(subscription_id)
    
    # If not in cache, try to get from database
    if not subscription:
        subscription = get_subscription_from_db(subscription_id, db)
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