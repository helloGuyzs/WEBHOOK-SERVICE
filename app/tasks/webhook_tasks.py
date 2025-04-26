from celery import Celery
from celery.utils.log import get_task_logger
from datetime import datetime, timedelta
import httpx
from app.config import settings
from app.database import SessionLocal
from app.models.webhook import WebhookDelivery, DeliveryAttempt
from app.models.subscription import Subscription
from app.core.db_init import init_db
from celery.schedules import crontab
import time

logger = get_task_logger(__name__)

# Initialize database tables with retry
retries = 3
for i in range(retries):
    if init_db():
        break
    time.sleep(5)

celery_app = Celery(
    'webhook_tasks',
    broker=f'redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0',
    backend=f'redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0'
)

# Add these configurations
celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
    task_track_started=True
)

@celery_app.task(bind=True, max_retries=settings.MAX_RETRY_ATTEMPTS)
def process_webhook(self, delivery_id: int):
    db = SessionLocal()
    try:
        # Get delivery record
        delivery = db.query(WebhookDelivery).get(delivery_id)
        if not delivery:
            logger.error(f"Delivery {delivery_id} not found")
            db.close()
            return
        
        # Get subscription details
        subscription = db.query(Subscription).get(delivery.subscription_id)
        if not subscription:
            logger.error(f"Subscription {delivery.subscription_id} not found")
            db.close()
            return
        
        # Store subscription URL before closing session
        target_url = subscription.target_url
        payload = delivery.payload
        
        # Update delivery status
        delivery.status = "IN_PROGRESS"
        delivery.attempt_count += 1
        delivery.last_attempt = datetime.utcnow()
        db.commit()
        db.close()
        
        # Make HTTP request without active session
        try:
            with httpx.Client(timeout=settings.WEBHOOK_TIMEOUT) as client:
                logger.info(f"Sending webhook to {target_url}")
                response = client.post(
                    target_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
            
            # Create new session for recording attempt
            db = SessionLocal()
            delivery = db.query(WebhookDelivery).get(delivery_id)
            
            attempt = DeliveryAttempt(
                delivery_id=delivery_id,
                attempt_number=delivery.attempt_count,
                status_code=response.status_code,
                outcome="SUCCESS" if response.status_code == 200 else "FAILED_ATTEMPT"
            )
            db.add(attempt)
            db.commit()
            
            if response.status_code == 200:
                delivery.status = "COMPLETED"
                db.commit()
                db.close()
                logger.info(f"Webhook {delivery_id} delivered successfully")
                return
            
            # Handle non-success response
            delivery.status = "PENDING_RETRY"
            retry_delay = settings.RETRY_INTERVALS[min(self.request.retries, len(settings.RETRY_INTERVALS)-1)]
            delivery.next_retry = datetime.utcnow() + timedelta(seconds=retry_delay)
            db.commit()
            db.close()
            logger.warning(f"Webhook {delivery_id} failed with status {response.status_code}")
            raise self.retry(countdown=retry_delay)
            
        except httpx.RequestError as exc:
            logger.error(f"HTTP request error for webhook {delivery_id}: {str(exc)}")
            db.rollback()
            db.close()
            raise self.retry(exc=exc)
            
    except Exception as exc:
        logger.error(f"Unhandled error in process_webhook {delivery_id}: {str(exc)}")
        try:
            db.rollback()
            db.close()
        except:
            pass
        raise self.retry(exc=exc)

@celery_app.task
def cleanup_old_logs():
    """Clean up old webhook delivery logs"""
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(hours=settings.LOG_RETENTION_HOURS)
        db.query(DeliveryAttempt).filter(DeliveryAttempt.created_at < cutoff_date).delete()
        db.commit()
    except Exception as e:
        logger.error(f"Error cleaning up old logs: {str(e)}")
        db.rollback()
    finally:
        db.close()

# Schedule cleanup task
celery_app.conf.beat_schedule = {
    'cleanup-old-logs': {
        'task': 'app.tasks.webhook_tasks.cleanup_old_logs',
        'schedule': crontab(hour='*/12'),  # Run every 12 hours
    },
}