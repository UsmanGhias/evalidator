from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
import uuid
import time
import json
from datetime import datetime, timedelta
from email_validation_engine import EmailValidator
import csv
import io
from werkzeug.utils import secure_filename
import re
import logging
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///email_validator.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)  # Extended token expiry

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app, origins=['http://localhost:3000', 'https://your-domain.com'])

# Redis connection with error handling
try:
    redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))
    redis_client.ping()  # Test connection
    logger.info("✅ Redis connected successfully")
except Exception as e:
    logger.warning(f"⚠️ Redis connection failed: {str(e)}. Using fallback mode.")
    redis_client = None

# JWT configuration
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(id=int(identity)).one_or_none()

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(20), default='free', index=True)
    emails_used = db.Column(db.Integer, default=0)
    emails_limit = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    subscription_expires = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    email_verified = db.Column(db.Boolean, default=False)

class ValidationJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(36), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='pending', index=True)
    total_emails = db.Column(db.Integer, default=0)
    processed_emails = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    results = db.Column(db.Text)  # JSON string
    file_name = db.Column(db.String(255))

# Enhanced Plan configurations
PLANS = {
    'free': {
        'name': 'Free',
        'emails_limit': 100,
        'price': {'monthly': 0, 'yearly': 0},
        'features': ['Basic validation', 'CSV export', 'Email support', '93% accuracy'],
        'batch_limit': 100,
        'api_access': False
    },
    'starter': {
        'name': 'Starter',
        'emails_limit': 5000,
        'price': {'monthly': 29, 'yearly': 290},
        'features': ['Advanced SMTP', 'Disposable detection', 'API access', 'Priority support', '95% accuracy'],
        'batch_limit': 1000,
        'api_access': True
    },
    'professional': {
        'name': 'Professional',
        'emails_limit': 25000,
        'price': {'monthly': 99, 'yearly': 990},
        'features': ['Unlimited validations', 'Advanced analytics', 'Custom integrations', 'Webhook support', '97% accuracy'],
        'batch_limit': 10000,
        'api_access': True
    },
    'enterprise': {
        'name': 'Enterprise',
        'emails_limit': 100000,
        'price': {'monthly': 299, 'yearly': 2990},
        'features': ['Custom SMTP servers', 'SLA guarantees', 'Dedicated support', 'On-premise options', '99% accuracy'],
        'batch_limit': 100000,
        'api_access': True
    }
}

def validate_email_format(email):
    """Validate email format before processing"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, "Password is strong"

def get_user_usage(user_id):
    """Get current user usage from database"""
    user = User.query.get(user_id)
    if not user:
        return None
    
    # Simple monthly reset for free plan (based on current month)
    if user.plan == 'free':
        current_month = datetime.now().month
        if user.last_login and user.last_login.month != current_month:
            user.emails_used = 0
            db.session.commit()
    
    return {
        'user_id': user.id,
        'plan': user.plan,
        'emails_used': user.emails_used,
        'emails_limit': user.emails_limit,
        'subscription_expires': user.subscription_expires.isoformat() if user.subscription_expires else None,
        'can_validate': user.emails_used < user.emails_limit or user.plan in ['professional', 'enterprise']
    }

def update_user_usage(user_id, emails_count):
    """Update user usage in database"""
    user = User.query.get(user_id)
    if user:
        user.emails_used += emails_count
        db.session.commit()
        return get_user_usage(user_id)
    return None

def can_validate_emails(user_id, emails_count):
    """Check if user can validate emails"""
    usage = get_user_usage(user_id)
    if not usage:
        return False, None
    
    # Premium plans have unlimited validations
    if usage['plan'] in ['professional', 'enterprise']:
        return True, usage
    
    # Check limits for other plans
    if usage['emails_used'] + emails_count <= usage['emails_limit']:
        return True, usage
    
    return False, usage

def parse_emails_from_text(text):
    """Parse emails from text input"""
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

# Enhanced Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        # Enhanced validation
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email_format(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_strong, password_message = validate_password_strength(password)
        if not is_strong:
            return jsonify({'error': password_message}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'An account with this email already exists'}), 400
        
        # Create new user
        try:
            password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            user = User(
                email=email,
                password_hash=password_hash,
                plan='free',
                emails_limit=PLANS['free']['emails_limit'],
                email_verified=True  # For demo purposes
            )
            
            db.session.add(user)
            db.session.commit()
            
            logger.info(f"New user registered: {email}")
            
            # Create access token
            access_token = create_access_token(identity=str(user.id))
            
            return jsonify({
                'success': True,
                'message': 'Account created successfully! Welcome to EmailValidator.',
                'access_token': access_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'plan': user.plan,
                    'emails_limit': user.emails_limit
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Database error during registration: {str(e)}")
            return jsonify({'error': 'Registration failed. Please try again.'}), 500
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email_format(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Generic error message for security
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated. Please contact support.'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"User logged in: {email}")
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'success': True,
            'message': 'Login successful! Welcome back.',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'plan': user.plan,
                'emails_limit': user.emails_limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed. Please try again.'}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        usage = get_user_usage(user_id)
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'plan': user.plan,
                'created_at': user.created_at.isoformat()
            },
            'usage': usage
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Anonymous validation route (no authentication required)
@app.route('/api/validate/anonymous', methods=['POST'])
def validate_emails_anonymous():
    try:
        # Check if file or text is provided
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Read file content
            content = file.read().decode('utf-8')
            emails = parse_emails_from_text(content)
        else:
            emails_text = request.form.get('emails', '')
            if not emails_text:
                return jsonify({'error': 'No emails provided'}), 400
            emails = parse_emails_from_text(emails_text)
        
        if not emails:
            return jsonify({'error': 'No valid emails found'}), 400
        
        # Remove duplicates
        unique_emails = remove_duplicates(emails)
        
        # Limit anonymous users to 10 emails
        if len(unique_emails) > 10:
            return jsonify({
                'error': 'Anonymous users can validate up to 10 emails. Please sign up for more.',
                'upgrade_required': True,
                'available_plans': PLANS
            }), 400
        
        # Create job with anonymous user (user_id = 0)
        job_id = str(uuid.uuid4())
        job = ValidationJob(
            job_id=job_id,
            user_id=0,  # Anonymous user
            status='processing',
            total_emails=len(unique_emails)
        )
        db.session.add(job)
        db.session.commit()
        
        # Process emails with enhanced engine and Redis caching
        validator = EmailValidator(redis_client=redis_client)
        results = validator.validate_emails_batch(unique_emails)
        
        # Update job
        job.status = 'completed'
        job.processed_emails = len(unique_emails)
        job.completed_at = datetime.utcnow()
        job.results = json.dumps(results)
        db.session.commit()
        
        # Calculate statistics
        valid_count = len([r for r in results if r['status'] == 'Valid'])
        invalid_count = len([r for r in results if r['status'] == 'Invalid'])
        unknown_count = len([r for r in results if r['status'] == 'Unknown'])
        disposable_count = len([r for r in results if r['status'] == 'Disposable'])
        role_count = len([r for r in results if r.get('is_role', False)])
        cached_count = len([r for r in results if r.get('cached', False)])
        
        return jsonify({
            'job_id': job_id,
            'status': 'completed',
            'total_emails': len(unique_emails),
            'results': results,
            'statistics': {
                'valid': valid_count,
                'invalid': invalid_count,
                'unknown': unknown_count,
                'disposable': disposable_count,
                'role_emails': role_count,
                'cached_results': cached_count
            },
            'anonymous': True,
            'processing_time': time.time(),
            'accuracy': '93%'  # Updated accuracy as requested
        }), 200
        
    except Exception as e:
        logger.error(f"Anonymous validation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Email validation routes (authenticated)
@app.route('/api/validate', methods=['POST'])
@jwt_required()
def validate_emails():
    try:
        user_id = get_jwt_identity()
        
        # Check if file or text is provided
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Read file content
            content = file.read().decode('utf-8')
            emails = parse_emails_from_text(content)
        else:
            emails_text = request.form.get('emails', '')
            if not emails_text:
                return jsonify({'error': 'No emails provided'}), 400
            emails = parse_emails_from_text(emails_text)
        
        if not emails:
            return jsonify({'error': 'No valid emails found'}), 400
        
        # Remove duplicates
        unique_emails = remove_duplicates(emails)
        
        # Check subscription limits
        can_validate, usage = can_validate_emails(user_id, len(unique_emails))
        
        if not can_validate:
            return jsonify({
                'error': 'Usage limit exceeded',
                'usage': usage,
                'upgrade_required': True,
                'available_plans': PLANS
            }), 402
        
        # Check plan-specific batch limits
        plan_config = PLANS.get(usage['plan'], PLANS['free'])
        max_emails_per_batch = {
            'free': 100,
            'starter': 1000,
            'professional': 10000,
            'enterprise': 100000
        }.get(usage['plan'], 100)
        
        if len(unique_emails) > max_emails_per_batch:
            return jsonify({
                'error': f'Maximum {max_emails_per_batch} emails allowed per batch for {plan_config["name"]} plan',
                'upgrade_required': True,
                'available_plans': PLANS
            }), 400
        
        # Create job
        job_id = str(uuid.uuid4())
        job = ValidationJob(
            job_id=job_id,
            user_id=user_id,
            status='processing',
            total_emails=len(unique_emails)
        )
        db.session.add(job)
        db.session.commit()
        
        # Process emails with enhanced engine and Redis caching
        validator = EmailValidator(redis_client=redis_client)
        results = validator.validate_emails_batch(unique_emails)
        
        # Update job
        job.status = 'completed'
        job.processed_emails = len(unique_emails)
        job.completed_at = datetime.utcnow()
        job.results = json.dumps(results)
        db.session.commit()
        
        # Update usage
        update_user_usage(user_id, len(unique_emails))
        
        # Calculate statistics
        valid_count = len([r for r in results if r['status'] == 'Valid'])
        invalid_count = len([r for r in results if r['status'] == 'Invalid'])
        unknown_count = len([r for r in results if r['status'] == 'Unknown'])
        disposable_count = len([r for r in results if r['status'] == 'Disposable'])
        role_count = len([r for r in results if r.get('is_role', False)])
        cached_count = len([r for r in results if r.get('cached', False)])
        
        # Determine accuracy based on plan
        accuracy_map = {
            'free': '93%',
            'starter': '95%',
            'professional': '97%',
            'enterprise': '99%'
        }
        accuracy = accuracy_map.get(usage['plan'], '93%')
        
        return jsonify({
            'job_id': job_id,
            'status': 'completed',
            'total_emails': len(unique_emails),
            'results': results,
            'statistics': {
                'valid': valid_count,
                'invalid': invalid_count,
                'unknown': unknown_count,
                'disposable': disposable_count,
                'role_emails': role_count,
                'cached_results': cached_count
            },
            'usage': get_user_usage(user_id),
            'processing_time': time.time(),
            'accuracy': accuracy
        }), 200
        
    except Exception as e:
        logger.error(f"Authenticated validation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    try:
        # Check if user is authenticated
        user_id = None
        try:
            user_id = get_jwt_identity()
        except:
            pass  # Anonymous user
        
        # Find job (allow anonymous users to access their jobs)
        if user_id:
            job = ValidationJob.query.filter_by(job_id=job_id, user_id=user_id).first()
        else:
            job = ValidationJob.query.filter_by(job_id=job_id, user_id=0).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        return jsonify({
            'job_id': job.job_id,
            'status': job.status,
            'total_emails': job.total_emails,
            'processed_emails': job.processed_emails,
            'created_at': job.created_at.isoformat(),
            'completed_at': job.completed_at.isoformat() if job.completed_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/results/<job_id>', methods=['GET'])
def get_job_results(job_id):
    try:
        # Check if user is authenticated
        user_id = None
        try:
            user_id = get_jwt_identity()
        except:
            pass  # Anonymous user
        
        # Find job (allow anonymous users to access their jobs)
        if user_id:
            job = ValidationJob.query.filter_by(job_id=job_id, user_id=user_id).first()
        else:
            job = ValidationJob.query.filter_by(job_id=job_id, user_id=0).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if not job.results:
            return jsonify({'error': 'Results not available'}), 404
        
        results = json.loads(job.results)
        
        # Apply filters
        status_filter = request.args.get('status', '')
        if status_filter:
            results = [r for r in results if r['status'] == status_filter]
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        start = (page - 1) * per_page
        end = start + per_page
        
        paginated_results = results[start:end]
        
        return jsonify({
            'results': paginated_results,
            'total': len(results),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(results) + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<job_id>', methods=['GET'])
def download_results(job_id):
    try:
        # Check if user is authenticated
        user_id = None
        try:
            user_id = get_jwt_identity()
        except:
            pass  # Anonymous user
        
        # Find job (allow anonymous users to access their jobs)
        if user_id:
            job = ValidationJob.query.filter_by(job_id=job_id, user_id=user_id).first()
        else:
            job = ValidationJob.query.filter_by(job_id=job_id, user_id=0).first()
        
        if not job or not job.results:
            return jsonify({'error': 'Results not found'}), 404
        
        results = json.loads(job.results)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Email', 'Status', 'Details', 'Is Role Email', 'Deliverability Score', 'Validation Time', 'Timestamp'])
        
        for result in results:
            writer.writerow([
                result['email'],
                result['status'],
                result['details'],
                'Yes' if result.get('is_role', False) else 'No',
                result.get('deliverability_score', 0),
                f"{result.get('validation_time', 0)}s",
                datetime.fromtimestamp(result['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'email_validation_results_{job_id[:8]}.csv'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Subscription routes
@app.route('/api/subscription', methods=['GET'])
@jwt_required()
def get_subscription():
    try:
        user_id = get_jwt_identity()
        usage = get_user_usage(user_id)
        
        if not usage:
            return jsonify({'error': 'User not found'}), 404
        
        plan_details = PLANS.get(usage['plan'], PLANS['free'])
        
        return jsonify({
            'user_id': user_id,
            'plan': usage['plan'],
            'plan_name': plan_details['name'],
            'emails_used': usage['emails_used'],
            'emails_limit': usage['emails_limit'],
            'subscription_expires': usage.get('subscription_expires'),
            'can_validate': usage['can_validate'],
            'plan_features': plan_details['features'],
            'plan_price': plan_details['price']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscription', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        plan = data.get('plan', 'starter')
        billing_cycle = data.get('billing_cycle', 'monthly')
        
        if plan not in PLANS:
            return jsonify({'error': 'Invalid plan'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user plan
        user.plan = plan
        user.emails_limit = PLANS[plan]['emails_limit']
        user.emails_used = 0  # Reset usage for new plan
        
        # Set subscription expiry
        if plan != 'free':
            if billing_cycle == 'monthly':
                user.subscription_expires = datetime.utcnow() + timedelta(days=30)
            else:  # yearly
                user.subscription_expires = datetime.utcnow() + timedelta(days=365)
        else:
            user.subscription_expires = None
        
        db.session.commit()
        
        usage = get_user_usage(user_id)
        plan_details = PLANS[plan]
        
        return jsonify({
            'success': True,
            'message': f'Successfully upgraded to {plan_details["name"]} plan',
            'usage': usage,
            'plan_details': plan_details
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/plans', methods=['GET'])
def get_plans():
    """Get all available plans (public endpoint)"""
    return jsonify({
        'plans': PLANS
    }), 200

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000) 