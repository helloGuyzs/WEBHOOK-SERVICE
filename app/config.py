from pydantic_settings import BaseSettings 

class Settings(BaseSettings):
    PROJECT_NAME: str = "Webhook Delivery Service"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/webhook_service"
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    BROKER_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    CELERY_RESULT_BACKEND: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    BROKER_CONNECTION_RETRY: bool = True
    BROKER_CONNECTION_MAX_RETRIES: int = 5
    
    # Webhook settings
    MAX_RETRY_ATTEMPTS: int = 3
    RETRY_INTERVALS: list[int] = [10, 30, 60]  # in seconds
    WEBHOOK_TIMEOUT: int = 10  # seconds
    LOG_RETENTION_HOURS: int = 72

settings = Settings()