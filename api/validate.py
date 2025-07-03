import os
import uuid
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
from email_validation_engine import EmailValidator
import time

app = Flask(__name__)
CORS(app)

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

def parse_emails_from_text(text):
    """Parse emails from text input (comma or newline separated)"""
    emails = []
    for line in text.replace(',', '\n').split('\n'):
        line = line.strip()
        if line:
            # Extract email addresses using regex
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            found_emails = re.findall(email_pattern, line)
            emails.extend(found_emails)
    return emails

def remove_duplicates(emails):
    """Remove duplicate emails while preserving order"""
    seen = set()
    unique_emails = []
    
    for email in emails:
        email_lower = email.lower().strip()
        if email_lower and email_lower not in seen:
            seen.add(email_lower)
            unique_emails.append(email_lower)
    
    return unique_emails

def handler(request):
    """Submit emails for validation"""
    try:
        if request.method != 'POST':
            return jsonify({'error': 'Method not allowed'}), 405
        
        emails = []
        
        # Handle JSON input
        if request.is_json:
            data = request.get_json()
            if 'emails' in data:
                if isinstance(data['emails'], str):
                    emails = parse_emails_from_text(data['emails'])
                elif isinstance(data['emails'], list):
                    emails = data['emails']
        
        # Handle form data
        elif request.form:
            if 'emails' in request.form:
                email_text = request.form['emails']
                emails = parse_emails_from_text(email_text)
        
        if not emails:
            return jsonify({'error': 'No valid emails provided'}), 400
        
        # Remove duplicates
        unique_emails = remove_duplicates(emails)
        
        # Limit to 10,000 emails for MVP
        if len(unique_emails) > 10000:
            return jsonify({'error': 'Maximum 10,000 emails allowed'}), 400
        
        # For small batches (< 100 emails), process immediately
        if len(unique_emails) <= 100:
            validator = EmailValidator()
            results = validator.validate_emails_batch(unique_emails)
            
            # Generate job ID for consistency
            job_id = str(uuid.uuid4())
            
            # Store results in Redis
            job_info = {
                'job_id': job_id,
                'total_emails': len(unique_emails),
                'status': 'completed',
                'created_at': time.time(),
                'progress': 100,
                'completed_at': time.time()
            }
            
            redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))
            redis_client.setex(f"results:{job_id}", 3600, json.dumps(results))
            
            return jsonify({
                'job_id': job_id,
                'total_emails': len(unique_emails),
                'status': 'completed',
                'message': f'Validation completed for {len(unique_emails)} emails',
                'results': results
            })
        
        # For larger batches, we'll need to implement a different approach
        # Since Vercel doesn't support long-running processes
        else:
            return jsonify({
                'error': 'Large batch processing not supported in serverless environment. Please use smaller batches (< 100 emails).'
            }), 400
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

# For Vercel
def api(request):
    return handler(request) 