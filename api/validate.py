from http.server import BaseHTTPRequestHandler
import json
import uuid
import re
import os
import time
import redis
from email_validation_engine import EmailValidator
from subscription import SubscriptionManager

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

def parse_emails_from_text(text):
    """Parse emails from text input (comma or newline separated)"""
    emails = []
    for line in text.replace(',', '\n').split('\n'):
        line = line.strip()
        if line:
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

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            
            emails = []
            if 'emails' in data:
                if isinstance(data['emails'], str):
                    emails = parse_emails_from_text(data['emails'])
                elif isinstance(data['emails'], list):
                    emails = data['emails']
            
            if not emails:
                self.send_error_response(400, 'No valid emails provided')
                return
            
            # Remove duplicates
            unique_emails = remove_duplicates(emails)
            
            # Get user ID (in production, get from authentication)
            user_id = data.get('user_id', 'anonymous')
            
            # Check subscription limits
            can_validate, usage = SubscriptionManager.can_validate_emails(user_id, len(unique_emails))
            
            if not can_validate:
                plan_details = SubscriptionManager.get_plan_details(usage['plan'])
                self.send_error_response(402, {
                    'error': 'Usage limit exceeded',
                    'usage': usage,
                    'upgrade_required': True,
                    'current_plan': usage['plan'],
                    'plan_name': plan_details['name'],
                    'emails_limit': usage['emails_limit'],
                    'emails_used': usage['emails_used'],
                    'available_plans': SubscriptionManager.get_all_plans()
                })
                return
            
            # Check plan-specific limits
            plan_config = SubscriptionManager.get_plan_details(usage['plan'])
            max_emails_per_batch = {
                'free': 100,
                'starter': 1000,
                'professional': 10000,
                'enterprise': 100000
            }.get(usage['plan'], 100)
            
            if len(unique_emails) > max_emails_per_batch:
                self.send_error_response(400, {
                    'error': f'Maximum {max_emails_per_batch} emails allowed per batch for {plan_config["name"]} plan. Please upgrade for larger batches.',
                    'upgrade_required': True,
                    'available_plans': SubscriptionManager.get_all_plans()
                })
                return
            
            # Process emails immediately
            validator = EmailValidator()
            results = validator.validate_emails_batch(unique_emails)
            
            # Update usage
            SubscriptionManager.update_usage(user_id, len(unique_emails))
            
            # Generate job ID
            job_id = str(uuid.uuid4())
            
            # Store results in Redis
            job_info = {
                'job_id': job_id,
                'user_id': user_id,
                'total_emails': len(unique_emails),
                'status': 'completed',
                'created_at': time.time(),
                'progress': 100,
                'completed_at': time.time(),
                'plan': usage['plan'],
                'plan_name': plan_config['name']
            }
            
            redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))
            redis_client.setex(f"results:{job_id}", 3600, json.dumps(results))
            
            # Calculate statistics
            valid_count = len([r for r in results if r['status'] == 'Valid'])
            invalid_count = len([r for r in results if r['status'] == 'Invalid'])
            unknown_count = len([r for r in results if r['status'] == 'Unknown'])
            disposable_count = len([r for r in results if r['status'] == 'Disposable'])
            role_count = len([r for r in results if r.get('is_role', False)])
            
            response = {
                'job_id': job_id,
                'total_emails': len(unique_emails),
                'status': 'completed',
                'message': f'Validation completed for {len(unique_emails)} emails',
                'results': results,
                'statistics': {
                    'valid': valid_count,
                    'invalid': invalid_count,
                    'unknown': unknown_count,
                    'disposable': disposable_count,
                    'role_emails': role_count
                },
                'usage': usage,
                'plan_details': plan_config,
                'processing_time': time.time() - job_info['created_at']
            }
            
            self.send_success_response(response)
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        if isinstance(message, dict):
            error_response = message
        else:
            error_response = {'error': message}
            
        self.wfile.write(json.dumps(error_response).encode())

# For Vercel
def api(request):
    return handler(request) 