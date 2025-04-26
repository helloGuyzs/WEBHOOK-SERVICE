from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.subscription import SubscriptionCreate, Subscription, SubscriptionUpdate
from app.models.subscription import Subscription as SubscriptionModel
from app.models.webhook import WebhookDelivery
from app.core.cache import cache_subscription, invalidate_subscription_cache
import hashlib
import secrets

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.post("/", response_model=Subscription, status_code=status.HTTP_201_CREATED)
def create_subscription(subscription: SubscriptionCreate, db: Session = Depends(get_db)):
    # Convert Pydantic model to dict and convert URL to string
    subscription_data = subscription.dict()
    subscription_data["target_url"] = str(subscription_data["target_url"])
    
    # Hash the secret key before storing
    secret_key = subscription_data.pop("secret_key")
    salt = secrets.token_hex(8)
    hashed_key = hashlib.sha256(f"{salt}{secret_key}".encode()).hexdigest()
    subscription_data["secret_key"] = f"{salt}:{hashed_key}"
    
    db_subscription = SubscriptionModel(**subscription_data)
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    cache_subscription(db_subscription)
    return db_subscription

@router.get("/", response_model=List[Subscription])
def list_subscriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subscriptions = db.query(SubscriptionModel).offset(skip).limit(limit).all()
    return subscriptions

@router.get("/{subscription_id}", response_model=Subscription)
def get_subscription(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(SubscriptionModel).filter(SubscriptionModel.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription

@router.put("/{subscription_id}", response_model=Subscription)
def update_subscription(
    subscription_id: int, 
    subscription: SubscriptionUpdate, 
    db: Session = Depends(get_db)
):
    db_subscription = db.query(SubscriptionModel).filter(SubscriptionModel.id == subscription_id).first()
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    for key, value in subscription.dict(exclude_unset=True).items():
        setattr(db_subscription, key, value)
    
    db.commit()
    db.refresh(db_subscription)
    invalidate_subscription_cache(subscription_id)
    cache_subscription(db_subscription)
    return db_subscription

@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(SubscriptionModel).filter(SubscriptionModel.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    db.delete(subscription)
    db.commit()
    invalidate_subscription_cache(subscription_id) 


@router.get("/{subscription_id}/recent-deliveries")
def get_recent_deliveries(subscription_id: int, limit: int = 20, db: Session = Depends(get_db)):
    deliveries = db.query(WebhookDelivery).filter(
        WebhookDelivery.subscription_id == subscription_id
    ).order_by(WebhookDelivery.created_at.desc()).limit(limit).all()
    return deliveries