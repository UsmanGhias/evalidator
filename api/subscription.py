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
    
    # Plan configurations
    PLANS = {
        'free': {
            'name': 'Free',
            'emails_limit': 100,
            'features': ['Basic validation', 'CSV export', 'Email support'],
            'price': {'monthly': 0, 'yearly': 0}
        },
        'starter': {
            'name': 'Starter',
            'emails_limit': 1000,
            'features': ['Advanced SMTP', 'Disposable detection', 'API access', 'Priority support'],
            'price': {'monthly': 29, 'yearly': 290}
        },
        'professional': {
            'name': 'Professional',
            'emails_limit': 10000,
            'features': ['Unlimited validations', 'Advanced analytics', 'Custom integrations', 'Webhook support'],
            'price': {'monthly': 99, 'yearly': 990}
        },
        'enterprise': {
            'name': 'Enterprise',
            'emails_limit': 100000,
            'features': ['Custom SMTP servers', 'SLA guarantees', 'Dedicated support', 'On-premise options'],
            'price': {'monthly': 299, 'yearly': 2990}
        }
    }
    
    @staticmethod
    def get_user_usage(user_id):
        """Get current user usage"""
        usage_data = redis_client.get(f"usage:{user_id}")
        if usage_data:
            return json.loads(usage_data)
        
        # Default free plan
        return {
            'user_id': user_id,
            'plan': 'free',
            'emails_used': 0,
            'emails_limit': SubscriptionManager.PLANS['free']['emails_limit'],
            'subscription_expires': None,
            'created_at': time.time(),
            'billing_cycle': None,
            'next_billing': None
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
        
        # Premium plans have unlimited validations
        if usage['plan'] in ['professional', 'enterprise']:
            return True, usage
        
        # Check limits for other plans
        if usage['emails_used'] + emails_count <= usage['emails_limit']:
            return True, usage
        
        return False, usage
    
    @staticmethod
    def upgrade_plan(user_id, plan, billing_cycle='monthly', payment_data=None):
        """Upgrade user to a new plan"""
        if plan not in SubscriptionManager.PLANS:
            return None, "Invalid plan"
        
        plan_config = SubscriptionManager.PLANS[plan]
        usage = SubscriptionManager.get_user_usage(user_id)
        
        # Update plan details
        usage['plan'] = plan
        usage['emails_limit'] = plan_config['emails_limit']
        usage['billing_cycle'] = billing_cycle
        usage['payment_data'] = payment_data or {}
        
        # Set subscription expiry based on billing cycle
        if plan != 'free':
            if billing_cycle == 'monthly':
                usage['subscription_expires'] = time.time() + (30 * 24 * 3600)  # 30 days
            else:  # yearly
                usage['subscription_expires'] = time.time() + (365 * 24 * 3600)  # 365 days
            
            usage['next_billing'] = usage['subscription_expires']
        else:
            usage['subscription_expires'] = None
            usage['next_billing'] = None
        
        # Reset usage for new plan
        usage['emails_used'] = 0
        
        redis_client.setex(f"usage:{user_id}", 86400 * 30, json.dumps(usage))
        return usage, None
    
    @staticmethod
    def get_plan_details(plan):
        """Get plan configuration details"""
        return SubscriptionManager.PLANS.get(plan, SubscriptionManager.PLANS['free'])
    
    @staticmethod
    def get_all_plans():
        """Get all available plans"""
        return SubscriptionManager.PLANS

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get subscription status and usage"""
        try:
            # Parse URL to get user_id
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            user_id = query_params.get('user_id', ['anonymous'])[0]
            
            usage = SubscriptionManager.get_user_usage(user_id)
            plan_details = SubscriptionManager.get_plan_details(usage['plan'])
            
            response = {
                'user_id': user_id,
                'plan': usage['plan'],
                'plan_name': plan_details['name'],
                'emails_used': usage['emails_used'],
                'emails_limit': usage['emails_limit'],
                'subscription_expires': usage.get('subscription_expires'),
                'billing_cycle': usage.get('billing_cycle'),
                'next_billing': usage.get('next_billing'),
                'can_validate': usage['emails_used'] < usage['emails_limit'] or usage['plan'] in ['professional', 'enterprise'],
                'plan_features': plan_details['features'],
                'plan_price': plan_details['price']
            }
            
            self.send_success_response(response)
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def do_POST(self):
        """Handle subscription upgrades and plan changes"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            action = data.get('action')
            user_id = data.get('user_id', 'anonymous')
            
            if action == 'upgrade':
                plan = data.get('plan', 'starter')
                billing_cycle = data.get('billing_cycle', 'monthly')
                payment_data = data.get('payment_data', {})
                
                usage, error = SubscriptionManager.upgrade_plan(user_id, plan, billing_cycle, payment_data)
                
                if error:
                    self.send_error_response(400, error)
                    return
                
                plan_details = SubscriptionManager.get_plan_details(plan)
                
                response = {
                    'success': True,
                    'message': f'Successfully upgraded to {plan_details["name"]} plan',
                    'usage': usage,
                    'plan_details': plan_details
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
                
            elif action == 'get_plans':
                plans = SubscriptionManager.get_all_plans()
                response = {
                    'success': True,
                    'plans': plans
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