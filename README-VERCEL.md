# Email Validator SaaS - Vercel Deployment

A scalable email validation service built with React.js frontend and Python serverless backend, deployed on Vercel.

## 🚀 Features

- **3-Layer Email Validation**
  - Syntax validation using regex and email-validator library
  - Domain/MX record validation
  - SMTP existence validation
- **Bulk Processing** - Up to 100 emails per batch (serverless limitation)
- **Real-time Results** - Instant validation for small batches
- **CSV Export** - Download results as CSV files
- **Disposable Email Detection** - Identifies temporary email services
- **Modern UI** - Clean, responsive interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- Axios for API calls
- Lucide React icons
- React Dropzone for file uploads

### Backend
- Python 3.9 serverless functions
- Flask for API endpoints
- Redis for data storage
- DNS resolution with dnspython
- SMTP validation
- Email validation library

### Deployment
- Vercel for hosting
- Redis Cloud for data storage
- Serverless architecture

## 📁 Project Structure

```
├── api/                          # Serverless API functions
│   ├── health.py                 # Health check endpoint
│   ├── validate.py               # Email validation endpoint
│   ├── results.py                # Results retrieval endpoint
│   ├── download.py               # CSV download endpoint
│   ├── email_validation_engine.py # Core validation logic
│   └── requirements.txt          # Python dependencies
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── services/             # API service layer
│   │   └── App.js               # Main application
│   ├── public/                   # Static assets
│   └── package.json             # Node.js dependencies
├── vercel.json                   # Vercel configuration
└── README-VERCEL.md             # This file
```

## 🚦 API Endpoints

### `GET /api/health`
Health check endpoint

### `POST /api/validate`
Submit emails for validation
- **Body**: `{ "emails": "email1@example.com,email2@example.com" }`
- **Response**: Job details with validation results (for small batches)

### `GET /api/results/{job_id}`
Get validation results
- **Query params**: `page`, `per_page`, `status`
- **Response**: Paginated results with summary statistics

### `GET /api/download/{job_id}`
Download results as CSV file

## 🔧 Environment Variables

### Required for Production
- `REDIS_URL` - Redis connection string (Redis Cloud recommended)

### Optional
- `REACT_APP_API_URL` - API base URL (auto-detected in Vercel)

## 🚀 Deployment Instructions

### Prerequisites
1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Redis Cloud** - Sign up at [redis.com](https://redis.com) (free tier available)
3. **GitHub Repository** - Code must be in a GitHub repository

### Step 1: Set up Redis Cloud
1. Create a free Redis Cloud account
2. Create a new database
3. Copy the connection string (format: `redis://username:password@host:port`)

### Step 2: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Import the project
3. Add environment variable:
   - `REDIS_URL` = your Redis connection string
4. Deploy

### Step 3: Configure Domain (Optional)
1. Add your custom domain in Vercel dashboard
2. Update DNS settings as instructed

## 🔧 Local Development

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- Redis server (local or cloud)

### Setup
```bash
# Clone repository
git clone https://github.com/UsmanGhias/evalidator.git
cd evalidator

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../api
pip install -r requirements.txt

# Set environment variables
export REDIS_URL="redis://localhost:6379"

# Start development
cd ../frontend
npm start  # Frontend at http://localhost:3000
```

## 📊 Usage Limits

### Serverless Limitations
- **Batch Size**: Maximum 100 emails per request
- **Timeout**: 30 seconds per request
- **Memory**: 1GB per function
- **Concurrent**: Multiple requests supported

### Redis Storage
- **TTL**: Results stored for 1 hour
- **Memory**: Depends on your Redis plan

## 🔒 Security Features

- **Input Validation**: Email format validation
- **Rate Limiting**: Built-in Vercel limits
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Comprehensive error responses

## 🎯 Performance

- **Cold Start**: ~2-3 seconds for first request
- **Warm Response**: ~100-500ms for subsequent requests
- **Validation Speed**: ~1-2 seconds per email (depends on SMTP response)
- **Concurrent Processing**: Up to 10 threads per batch

## 🆘 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check REDIS_URL environment variable
   - Verify Redis Cloud database is active
   - Ensure connection string format is correct

2. **SMTP Validation Slow**
   - Some mail servers have rate limits
   - Consider reducing batch size
   - SMTP validation may timeout for some domains

3. **Large File Upload Issues**
   - Vercel has 4.5MB request limit
   - Use smaller CSV files or split large files

### Debug Mode
Enable debug logging by setting `DEBUG=true` in environment variables.

## 📈 Scaling Considerations

### Current Limitations
- Serverless functions have execution time limits
- No background job processing
- Limited to smaller batches

### Scaling Options
1. **Increase Batch Size**: Optimize validation logic
2. **External Queue**: Use services like AWS SQS for large batches
3. **Dedicated Server**: Move to containerized deployment for unlimited processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review Vercel deployment logs

---

**Note**: This is a serverless implementation optimized for Vercel. For high-volume processing (>100 emails), consider the Docker-based deployment option. 