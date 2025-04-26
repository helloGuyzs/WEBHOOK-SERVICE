from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class DeliveryAttempt(Base):
    __tablename__ = "delivery_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("webhook_deliveries.id"))
    attempt_number = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    status_code = Column(Integer, nullable=True)
    error_details = Column(Text, nullable=True)
    outcome = Column(String, nullable=False)

class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    payload = Column(JSON, nullable=False)
    event_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    attempt_count = Column(Integer, default=0)
    last_attempt = Column(DateTime(timezone=True), nullable=True)
    next_retry = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    attempts = relationship("DeliveryAttempt", backref="delivery") 