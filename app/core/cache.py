import json
from redis import Redis
from app.config import settings
from app.models.subscription import Subscription

redis_client = Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

def cache_subscription(subscription: Subscription):
    """Cache subscription details"""
    key = f"subscription:{subscription.id}"
    data = {
        "id": subscription.id,
        "target_url": str(subscription.target_url),
        "event_types": subscription.event_types,
        "is_active": subscription.is_active,
        "secret_key": subscription.secret_key
    }
    redis_client.setex(key, 3600, json.dumps(data))  # Cache for 1 hour

def get_cached_subscription(subscription_id: int) -> dict:
    """Get subscription details from cache"""
    key = f"subscription:{subscription_id}"
    data = redis_client.get(key)
    return json.loads(data) if data else None

def invalidate_subscription_cache(subscription_id: int):
    """Remove subscription from cache"""
    key = f"subscription:{subscription_id}"
    redis_client.delete(key) 