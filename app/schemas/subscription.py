from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class SubscriptionBase(BaseModel):
    target_url: HttpUrl
    event_types: Optional[List[str]] = None

class SubscriptionCreate(SubscriptionBase):
    secret_key: str

class SubscriptionUpdate(SubscriptionBase):
    pass

class Subscription(SubscriptionBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True