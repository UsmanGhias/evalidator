from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

def handler(request):
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Email validation service is running'})

# For Vercel
def api(request):
    return handler(request) 