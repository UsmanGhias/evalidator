from http.server import BaseHTTPRequestHandler
import json
import os
import redis
from urllib.parse import urlparse, parse_qs

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse URL to get job_id and query parameters
            parsed_url = urlparse(self.path)
            path_parts = parsed_url.path.split('/')
            
            # Extract job_id from URL path
            if len(path_parts) < 3:
                self.send_error_response(400, 'Job ID required')
                return
            
            job_id = path_parts[-1]
            
            # Parse query parameters
            query_params = parse_qs(parsed_url.query)
            page = int(query_params.get('page', ['1'])[0])
            per_page = int(query_params.get('per_page', ['50'])[0])
            status_filter = query_params.get('status', [''])[0]
            
            # Get job info
            job_data = redis_client.get(f"job:{job_id}")
            if not job_data:
                self.send_error_response(404, 'Job not found')
                return
            
            job_info = json.loads(job_data)
            
            # Get results
            results_data = redis_client.get(f"results:{job_id}")
            if not results_data:
                self.send_error_response(404, 'Results not found')
                return
            
            results = json.loads(results_data)
            
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
            
            response = {
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
        error_response = {'error': message}
        self.wfile.write(json.dumps(error_response).encode()) 