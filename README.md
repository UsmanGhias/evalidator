# Email Validation SaaS - MVP

A scalable web-based email validation service that allows users to validate bulk emails for existence and deliverability.

## 🚀 Features

- **Bulk Email Validation**: Validate up to 10,000 emails at once
- **Multiple Input Methods**: Paste emails or upload CSV/TXT files
- **3-Layer Validation Pipeline**:
  - Syntax validation
  - Domain/MX record checking
  - SMTP server verification
- **Real-time Results**: View validation results in a clean table interface
- **Export Functionality**: Download results as CSV
- **Queue Processing**: Scalable background processing with Celery + Redis
- **Duplicate Removal**: Automatic duplicate email detection

## 🏗️ Architecture

```
├── frontend/          # React.js frontend
├── backend/           # Flask API server
├── worker/            # Celery worker for email validation
├── docker-compose.yml # Local development setup
└── requirements.txt   # Python dependencies
```

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Python Flask, Celery, Redis
- **Database**: SQLite (development), PostgreSQL (production)
- **Validation**: Custom email validation pipeline
- **Deployment**: Vercel (frontend), Render/DigitalOcean (backend)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Redis server

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Worker Setup
```bash
cd backend
celery -A worker worker --loglevel=info
```

## 📊 Validation Results

Each email receives one of these statuses:
- ✅ **Valid**: Email exists and is deliverable
- ❌ **Invalid**: Email doesn't exist or is undeliverable
- ⚠️ **Catch-All**: Domain accepts all emails
- 🗑️ **Disposable**: Temporary/disposable email service
- ❌ **Syntax Error**: Invalid email format
- ❌ **No MX Record**: Domain has no mail servers
- ❌ **SMTP Error**: Server timeout or connection issues

## 🔧 Configuration

Environment variables:
- `REDIS_URL`: Redis connection string
- `FLASK_ENV`: development/production
- `UPLOAD_FOLDER`: File upload directory

## 📝 API Endpoints

- `POST /api/validate`: Submit emails for validation
- `GET /api/results/{job_id}`: Get validation results
- `GET /api/status/{job_id}`: Check job status
- `GET /api/download/{job_id}`: Download CSV results

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Render/DigitalOcean)
```bash
# Set environment variables
# Deploy Flask app + Celery worker
```

## 📈 Scaling Considerations

- Redis for job queue and caching
- Horizontal scaling with multiple Celery workers
- Rate limiting for API endpoints
- Database optimization for large result sets

## 🔐 Security

- Input validation and sanitization
- File upload restrictions
- Rate limiting
- CORS configuration
- Environment variable management

## 📄 License

MIT License - Feel free to use this for your email validation service! 