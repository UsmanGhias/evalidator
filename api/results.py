import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis

app = Flask(__name__)
CORS(app)

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

def handler(request):
    """Get validation results"""
    try:
        # Extract job_id from URL path
        path_parts = request.path.split('/')
        if len(path_parts) < 3:
            return jsonify({'error': 'Job ID required'}), 400
        
        job_id = path_parts[-1]
        
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

# For Vercel
def api(request):
    return handler(request) 