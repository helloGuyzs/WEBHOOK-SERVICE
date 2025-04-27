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
import requests

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
            return
        
        # Get subscription details
        subscription = db.query(Subscription).get(delivery.subscription_id)
        if not subscription:
            logger.error(f"Subscription {delivery.subscription_id} not found")
            return
        
        target_url = subscription.target_url
        
        # Check if max retries reached
        if delivery.attempt_count >= settings.MAX_RETRY_ATTEMPTS:
            delivery.status = "FAILED"
            delivery.next_retry = None
            db.commit()
            logger.error(f"Webhook {delivery_id} failed permanently after {settings.MAX_RETRY_ATTEMPTS} attempts")
            return
        
        # Update delivery status and attempt count
        delivery.status = "IN_PROGRESS"
        delivery.attempt_count += 1
        delivery.last_attempt = datetime.utcnow()
        
        try:
            logger.info(f"Sending webhook to {target_url}")
            response = requests.post(
                target_url,
                json=delivery.payload,
                timeout=settings.WEBHOOK_TIMEOUT
            )
            
            # Record attempt
            attempt = DeliveryAttempt(
                delivery_id=delivery_id,
                attempt_number=delivery.attempt_count,
                status_code=response.status_code,
                error_details=response.text if response.status_code >= 400 else None,
                outcome="SUCCESS" if response.status_code < 400 else "FAILED_ATTEMPT"
            )
            db.add(attempt)
            
            if response.status_code >= 400:
                if delivery.attempt_count >= settings.MAX_RETRY_ATTEMPTS:
                    delivery.status = "FAILED"
                    delivery.next_retry = None
                    logger.error(f"Webhook {delivery_id} failed permanently after {settings.MAX_RETRY_ATTEMPTS} attempts")
                else:
                    retry_delay = settings.RETRY_INTERVALS[delivery.attempt_count - 1]
                    delivery.status = "PENDING_RETRY"
                    delivery.next_retry = datetime.utcnow() + timedelta(seconds=retry_delay)
                    process_webhook.apply_async(args=[delivery_id], countdown=retry_delay)
            else:
                delivery.status = "COMPLETED"
                delivery.next_retry = None
            
            db.commit()
            
        except requests.RequestException as e:
            attempt = DeliveryAttempt(
                delivery_id=delivery_id,
                attempt_number=delivery.attempt_count,
                error_details=str(e),
                outcome="FAILED_ATTEMPT"
            )
            db.add(attempt)
            
            if delivery.attempt_count >= settings.MAX_RETRY_ATTEMPTS:
                delivery.status = "FAILED"
                delivery.next_retry = None
                logger.error(f"Webhook {delivery_id} failed permanently after max retries")
            else:
                retry_delay = settings.RETRY_INTERVALS[delivery.attempt_count - 1]
                delivery.status = "PENDING_RETRY"
                delivery.next_retry = datetime.utcnow() + timedelta(seconds=retry_delay)
                process_webhook.apply_async(args=[delivery_id], countdown=retry_delay)
            
            db.commit()
            
    except Exception as exc:
        logger.error(f"Unhandled error in process_webhook {delivery_id}: {str(exc)}")
        if 'delivery' in locals():
            delivery.status = "FAILED"
            delivery.next_retry = None
            db.commit()
    finally:
        db.close()

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