from http.server import BaseHTTPRequestHandler
import json
import os
import redis
import time
import uuid
from urllib.parse import urlparse, parse_qs

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

class SubscriptionManager:
    """Manages user subscriptions and usage limits"""
    
    @staticmethod
    def get_user_usage(user_id):
        """Get current user usage"""
        usage_data = redis_client.get(f"usage:{user_id}")
        if usage_data:
            return json.loads(usage_data)
        return {
            'user_id': user_id,
            'plan': 'free',
            'emails_used': 0,
            'emails_limit': 100,
            'subscription_expires': None,
            'created_at': time.time()
        }
    
    @staticmethod
    def update_usage(user_id, emails_count):
        """Update user usage"""
        usage = SubscriptionManager.get_user_usage(user_id)
        usage['emails_used'] += emails_count
        redis_client.setex(f"usage:{user_id}", 86400 * 30, json.dumps(usage))  # 30 days TTL
        return usage
    
    @staticmethod
    def can_validate_emails(user_id, emails_count):
        """Check if user can validate emails"""
        usage = SubscriptionManager.get_user_usage(user_id)
        
        if usage['plan'] == 'premium':
            return True, usage
        
        if usage['emails_used'] + emails_count <= usage['emails_limit']:
            return True, usage
        
        return False, usage
    
    @staticmethod
    def upgrade_to_premium(user_id, payment_data):
        """Upgrade user to premium plan"""
        # In production, integrate with Stripe/PayPal here
        usage = SubscriptionManager.get_user_usage(user_id)
        usage['plan'] = 'premium'
        usage['emails_limit'] = float('inf')  # Unlimited
        usage['subscription_expires'] = time.time() + (7 * 24 * 3600)  # 7 days
        usage['payment_data'] = payment_data
        
        redis_client.setex(f"usage:{user_id}", 86400 * 30, json.dumps(usage))
        return usage

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get subscription status and usage"""
        try:
            # Parse URL to get user_id
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            user_id = query_params.get('user_id', ['anonymous'])[0]
            
            usage = SubscriptionManager.get_user_usage(user_id)
            
            response = {
                'user_id': user_id,
                'plan': usage['plan'],
                'emails_used': usage['emails_used'],
                'emails_limit': usage['emails_limit'],
                'subscription_expires': usage.get('subscription_expires'),
                'can_validate': usage['emails_used'] < usage['emails_limit'] or usage['plan'] == 'premium'
            }
            
            self.send_success_response(response)
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def do_POST(self):
        """Handle subscription upgrades"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            action = data.get('action')
            user_id = data.get('user_id', 'anonymous')
            
            if action == 'upgrade':
                payment_data = data.get('payment_data', {})
                usage = SubscriptionManager.upgrade_to_premium(user_id, payment_data)
                
                response = {
                    'success': True,
                    'message': 'Successfully upgraded to premium plan',
                    'usage': usage
                }
                
                self.send_success_response(response)
                
            elif action == 'check_usage':
                emails_count = data.get('emails_count', 0)
                can_validate, usage = SubscriptionManager.can_validate_emails(user_id, emails_count)
                
                response = {
                    'can_validate': can_validate,
                    'usage': usage,
                    'message': 'Can validate emails' if can_validate else 'Usage limit exceeded'
                }
                
                self.send_success_response(response)
                
            else:
                self.send_error_response(400, 'Invalid action')
                
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
        error_response = {'error': message}
        self.wfile.write(json.dumps(error_response).encode()) 