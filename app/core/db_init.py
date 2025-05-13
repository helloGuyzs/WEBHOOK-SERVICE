from app.database import Base, engine
from app.models.subscription import Subscription
from app.models.webhook import WebhookDelivery, DeliveryAttempt
import time
from sqlalchemy import inspect, text
import logging
from sqlalchemy.exc import OperationalError, ProgrammingError

logger = logging.getLogger(__name__)

def wait_for_db():
    max_retries = 60  # Increase max retries
    retry_interval = 3  # Longer interval between retries
    
    for i in range(max_retries):
        try:
            # Try a simple connection test
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                row = result.fetchone()
                if row and row[0] == 1:
                    logger.info("Database connection successful")
                    return True
        except (OperationalError, ProgrammingError) as e:
            # These are the common exceptions when DB is not ready
            logger.info(f"Waiting for database... attempt {i+1}/{max_retries}: {str(e)}")
            time.sleep(retry_interval)
        except Exception as e:
            # Log other unexpected errors
            logger.warning(f"Unexpected error connecting to database: {str(e)}")
            time.sleep(retry_interval)
    
    logger.error("Failed to connect to database after maximum retries")
    return False

def init_db():
    if not wait_for_db():
        logger.error("Database not available after maximum retries")
        return False
        
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        tables_to_create = []
        for table in [Subscription.__table__, WebhookDelivery.__table__, DeliveryAttempt.__table__]:
            if table.name not in existing_tables:
                tables_to_create.append(table)
        
        if tables_to_create:
            Base.metadata.create_all(bind=engine, tables=tables_to_create)
            logger.info("Successfully created missing database tables")
        else:
            logger.info("All tables already exist")
        return True
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False