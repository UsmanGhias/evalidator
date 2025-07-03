import os
import uuid
import csv
import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import pandas as pd
from celery_app import celery_app
import redis
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'txt', 'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_emails_from_text(text):
    """Parse emails from text input (comma or newline separated)"""
    import re
    
    # Split by comma or newline
    emails = []
    for line in text.replace(',', '\n').split('\n'):
        line = line.strip()
        if line:
            # Extract email addresses using regex
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            found_emails = re.findall(email_pattern, line)
            emails.extend(found_emails)
    
    return emails

def parse_emails_from_file(file_path):
    """Parse emails from uploaded CSV or TXT file"""
    emails = []
    
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
            # Look for email columns
            email_columns = [col for col in df.columns if 'email' in col.lower() or 'mail' in col.lower()]
            
            if email_columns:
                # Use first email column found
                emails = df[email_columns[0]].dropna().tolist()
            else:
                # If no email column found, try first column
                emails = df.iloc[:, 0].dropna().tolist()
        else:
            # TXT file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                emails = parse_emails_from_text(content)
    
    except Exception as e:
        print(f"Error parsing file: {e}")
        return []
    
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Email validation service is running'})

@app.route('/api/validate', methods=['POST'])
def validate_emails():
    """Submit emails for validation"""
    try:
        emails = []
        
        # Check if file upload or text input
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4()}_{filename}")
                file.save(file_path)
                
                emails = parse_emails_from_file(file_path)
                
                # Clean up uploaded file
                os.remove(file_path)
        
        # Check for text input
        elif 'emails' in request.form:
            email_text = request.form['emails']
            emails = parse_emails_from_text(email_text)
        
        elif request.is_json:
            data = request.get_json()
            if 'emails' in data:
                if isinstance(data['emails'], str):
                    emails = parse_emails_from_text(data['emails'])
                elif isinstance(data['emails'], list):
                    emails = data['emails']
        
        if not emails:
            return jsonify({'error': 'No valid emails provided'}), 400
        
        # Remove duplicates
        unique_emails = remove_duplicates(emails)
        
        # Limit to 10,000 emails for MVP
        if len(unique_emails) > 10000:
            return jsonify({'error': 'Maximum 10,000 emails allowed'}), 400
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Store job info in Redis
        job_info = {
            'job_id': job_id,
            'total_emails': len(unique_emails),
            'status': 'pending',
            'created_at': pd.Timestamp.now().isoformat(),
            'progress': 0
        }
        
        redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_info))  # Expire in 1 hour
        
        # Queue the validation task using celery_app directly
        task = celery_app.send_task('worker.validate_emails_task', args=[job_id, unique_emails])
        
        return jsonify({
            'job_id': job_id,
            'total_emails': len(unique_emails),
            'status': 'queued',
            'message': f'Validation started for {len(unique_emails)} emails'
        })
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get job status and progress"""
    try:
        job_data = redis_client.get(f"job:{job_id}")
        if not job_data:
            return jsonify({'error': 'Job not found'}), 404
        
        job_info = json.loads(job_data)
        return jsonify(job_info)
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """Get validation results"""
    try:
        # Get job info
        job_data = redis_client.get(f"job:{job_id}")
        if not job_data:
            return jsonify({'error': 'Job not found'}), 404
        
        job_info = json.loads(job_data)
        
        # Get results
        results_data = redis_client.get(f"results:{job_id}")
        if not results_data:
            return jsonify({'error': 'Results not found'}), 404
        
        results = json.loads(results_data)
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status_filter = request.args.get('status', '')
        
        # Filter by status if provided
        if status_filter:
            filtered_results = [r for r in results if r['status'].lower() == status_filter.lower()]
        else:
            filtered_results = results
        
        # Pagination
        start = (page - 1) * per_page
        end = start + per_page
        paginated_results = filtered_results[start:end]
        
        # Calculate summary statistics
        status_counts = {}
        for result in results:
            status = result['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return jsonify({
            'job_id': job_id,
            'status': job_info['status'],
            'total_emails': job_info['total_emails'],
            'progress': job_info.get('progress', 0),
            'results': paginated_results,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': len(filtered_results),
                'pages': (len(filtered_results) + per_page - 1) // per_page
            },
            'summary': status_counts
        })
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/download/<job_id>', methods=['GET'])
def download_results(job_id):
    """Download results as CSV"""
    try:
        # Get results
        results_data = redis_client.get(f"results:{job_id}")
        if not results_data:
            return jsonify({'error': 'Results not found'}), 404
        
        results = json.loads(results_data)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Email', 'Status', 'Details'])
        
        # Write data
        for result in results:
            writer.writerow([
                result['email'],
                result['status'],
                result.get('details', '')
            ])
        
        # Create file-like object
        output.seek(0)
        csv_data = output.getvalue()
        output.close()
        
        # Create response
        csv_file = io.BytesIO(csv_data.encode('utf-8'))
        csv_file.seek(0)
        
        return send_file(
            csv_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'email_validation_results_{job_id[:8]}.csv'
        )
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics (for admin dashboard)"""
    try:
        # This would typically come from a database
        # For now, return mock data
        stats = {
            'total_validations': 0,
            'total_emails_processed': 0,
            'active_jobs': 0,
            'success_rate': 0
        }
        
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 