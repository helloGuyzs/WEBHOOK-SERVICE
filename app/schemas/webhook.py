from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class WebhookIngestion(BaseModel):
    payload: Dict[str, Any]
    event_type: Optional[str] = None

class DeliveryAttemptResponse(BaseModel):
    attempt_number: int
    timestamp: datetime
    status_code: Optional[int]
    outcome: str
    error_details: Optional[str]

class DeliveryAttemptSchema(BaseModel):
    attempt_number: int
    status_code: Optional[int]
    outcome: str
    timestamp: datetime

    class Config:
        from_attributes = True

class WebhookDeliveryStatus(BaseModel):
    id: int
    status: str
    attempt_count: int
    next_retry: Optional[datetime]
    attempts: List[DeliveryAttemptSchema]

    class Config:
        from_attributes = True 