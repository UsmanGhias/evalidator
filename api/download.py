import os
import json
import csv
import io
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import redis

app = Flask(__name__)
CORS(app)

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

def handler(request):
    """Download results as CSV"""
    try:
        # Extract job_id from URL path
        path_parts = request.path.split('/')
        if len(path_parts) < 3:
            return jsonify({'error': 'Job ID required'}), 400
        
        job_id = path_parts[-1]
        
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
        
        # Create response
        csv_content = output.getvalue()
        output.close()
        
        response = Response(
            csv_content,
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=email_validation_results_{job_id[:8]}.csv'
            }
        )
        
        return response
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

# For Vercel
def api(request):
    return handler(request) 