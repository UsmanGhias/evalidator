import os
import json
import redis
from celery import current_task
from celery_app import celery_app
from email_validation_engine import EmailValidator
import pandas as pd

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

@celery_app.task(bind=True)
def validate_emails_task(self, job_id, emails):
    """
    Celery task to validate emails in background
    """
    try:
        # Initialize validator
        validator = EmailValidator()
        
        # Update job status
        job_info = {
            'job_id': job_id,
            'total_emails': len(emails),
            'status': 'processing',
            'progress': 0,
            'processed': 0,
            'started_at': pd.Timestamp.now().isoformat()
        }
        
        redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))
        
        # Progress callback function
        def progress_callback(progress, processed, total):
            job_info['progress'] = round(progress, 2)
            job_info['processed'] = processed
            redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))
            
            # Update Celery task state
            current_task.update_state(
                state='PROGRESS',
                meta={
                    'progress': progress,
                    'processed': processed,
                    'total': total
                }
            )
        
        # Validate emails
        results = validator.validate_emails_batch(emails, progress_callback)
        
        # Store results in Redis
        redis_client.setex(f"results:{job_id}", 3600, json.dumps(results))
        
        # Update job status to completed
        job_info['status'] = 'completed'
        job_info['progress'] = 100
        job_info['processed'] = len(emails)
        job_info['completed_at'] = pd.Timestamp.now().isoformat()
        
        redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))
        
        return {
            'job_id': job_id,
            'status': 'completed',
            'total_emails': len(emails),
            'results_count': len(results)
        }
        
    except Exception as e:
        # Update job status to failed
        job_info = {
            'job_id': job_id,
            'status': 'failed',
            'error': str(e),
            'failed_at': pd.Timestamp.now().isoformat()
        }
        
        redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))
        
        # Re-raise the exception
        raise e

@celery_app.task
def cleanup_old_jobs():
    """
    Cleanup old job data from Redis (run periodically)
    """
    try:
        # This would typically be run as a periodic task
        # to clean up old job data from Redis
        pass
    except Exception as e:
        print(f"Cleanup task failed: {e}")

# Register tasks
celery_app.autodiscover_tasks(['worker']) 