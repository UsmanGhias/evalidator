from http.server import BaseHTTPRequestHandler
import json
import csv
import io
import os
import redis
from urllib.parse import urlparse

# Redis connection
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse URL to get job_id
            parsed_url = urlparse(self.path)
            path_parts = parsed_url.path.split('/')
            
            # Extract job_id from URL path
            if len(path_parts) < 3:
                self.send_error_response(400, 'Job ID required')
                return
            
            job_id = path_parts[-1]
            
            # Get results
            results_data = redis_client.get(f"results:{job_id}")
            if not results_data:
                self.send_error_response(404, 'Results not found')
                return
            
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
            
            # Get CSV content
            csv_content = output.getvalue()
            output.close()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Disposition', f'attachment; filename=email_validation_results_{job_id[:8]}.csv')
            self.end_headers()
            self.wfile.write(csv_content.encode())
            
        except Exception as e:
            self.send_error_response(500, f'An error occurred: {str(e)}')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        error_response = {'error': message}
        self.wfile.write(json.dumps(error_response).encode()) 