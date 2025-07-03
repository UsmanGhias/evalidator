# Deployment Guide - Email Validation SaaS

This guide covers deploying the Email Validation SaaS to production environments.

## 🚀 Quick Deploy Options

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd email-validation-saas
   ```

2. **Configure environment**:
   ```bash
   # Copy and edit environment files
   cp backend/.env.example backend/.env
   # Edit backend/.env with production values
   ```

3. **Deploy with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

### Option 2: Separate Services

#### Frontend (Vercel)
1. **Build and deploy**:
   ```bash
   cd frontend
   npm run build
   # Deploy to Vercel
   vercel --prod
   ```

2. **Environment variables**:
   ```
   REACT_APP_API_URL=https://your-api-domain.com
   ```

#### Backend (Render/Railway/DigitalOcean)
1. **Deploy Flask app**:
   ```bash
   cd backend
   # Deploy to your platform
   ```

2. **Environment variables**:
   ```
   FLASK_ENV=production
   REDIS_URL=redis://your-redis-url:6379/0
   SECRET_KEY=your-secret-key
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

3. **Deploy Celery worker**:
   ```bash
   celery -A worker worker --loglevel=info
   ```

## 🔧 Production Configuration

### Environment Variables

#### Backend (.env)
```bash
FLASK_ENV=production
REDIS_URL=redis://your-redis-instance:6379/0
SECRET_KEY=your-super-secret-key-here
CORS_ORIGINS=https://yourdomain.com
UPLOAD_FOLDER=/app/uploads
```

#### Frontend
```bash
REACT_APP_API_URL=https://api.yourdomain.com
```

### Database Setup
- **Development**: SQLite (included)
- **Production**: PostgreSQL (recommended)

### Redis Setup
- **Development**: Local Redis
- **Production**: Redis Cloud, AWS ElastiCache, or DigitalOcean Managed Redis

## 🌐 Platform-Specific Deployment

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Render (Backend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy both web service and worker service

### Railway (Full Stack)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure services:
   - **Web Service**: Flask app
   - **Worker Service**: Celery worker
   - **Database**: Managed Redis
   - **Static Site**: React frontend

## 📊 Monitoring & Scaling

### Health Checks
- **Backend**: `GET /api/health`
- **Frontend**: Standard HTTP status
- **Worker**: Celery monitoring

### Scaling Considerations
1. **Horizontal scaling**: Multiple Celery workers
2. **Vertical scaling**: Increase worker memory/CPU
3. **Database**: Redis clustering for high availability
4. **Load balancing**: Multiple Flask instances

### Performance Optimization
- **Caching**: Redis for job results
- **CDN**: Static assets via CDN
- **Compression**: Gzip enabled
- **Rate limiting**: API endpoint protection

## 🔐 Security Checklist

### Backend Security
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] File upload restrictions

### Frontend Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] XSS protection enabled
- [ ] Content Security Policy

## 📈 Monitoring & Logging

### Recommended Tools
- **Application Monitoring**: Sentry, LogRocket
- **Infrastructure**: Datadog, New Relic
- **Uptime Monitoring**: Pingdom, StatusCake

### Log Configuration
```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## 🚨 Troubleshooting

### Common Issues

1. **Redis Connection Error**:
   ```
   Check REDIS_URL environment variable
   Verify Redis instance is running
   ```

2. **CORS Errors**:
   ```
   Update CORS_ORIGINS in backend/.env
   Ensure frontend URL is whitelisted
   ```

3. **File Upload Issues**:
   ```
   Check UPLOAD_FOLDER permissions
   Verify file size limits
   ```

4. **Celery Worker Not Processing**:
   ```
   Restart Celery worker
   Check Redis connection
   Verify task queue
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Your deployment commands
```

## 📝 Maintenance

### Regular Tasks
- [ ] Monitor Redis memory usage
- [ ] Clean up old job results
- [ ] Update dependencies
- [ ] Backup configuration
- [ ] Review logs for errors

### Backup Strategy
- **Configuration**: Environment variables
- **Data**: Redis snapshots (if persistent)
- **Code**: Git repository

## 🆘 Support

For deployment issues:
1. Check logs for specific error messages
2. Verify all environment variables are set
3. Test API endpoints individually
4. Monitor resource usage

## 📚 Additional Resources

- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [Celery Production Guide](https://docs.celeryproject.org/en/stable/userguide/deployment.html)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Redis Production Guide](https://redis.io/topics/admin) 