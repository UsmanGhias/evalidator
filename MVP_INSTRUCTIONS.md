# 🚀 EmailValidator MVP - Startup Instructions

## Quick Start

1. **Start the Backend:**
   ```bash
   cd backend
   python3 app.py
   ```
   The backend will run on http://localhost:5000

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

3. **Test the System:**
   ```bash
   python3 test_mvp.py
   ```

## Features Included

✅ **Complete Authentication System**
- User registration and login
- JWT token-based authentication
- Secure password hashing

✅ **Email Validation Engine**
- 4-layer validation (syntax, domain, SMTP, role detection)
- Real-time processing
- Support for bulk validation

✅ **Usage Tracking**
- Free plan: 100 emails/month
- Paid plans: 1K, 10K, 100K emails
- Monthly usage reset for free users

✅ **Professional UI**
- Modern, responsive design
- Real-time progress tracking
- Export results to CSV

✅ **Subscription Management**
- Multiple pricing plans
- Plan upgrade functionality
- Usage limits enforcement

## Default Test Account

- Email: test@example.com
- Password: testpassword123

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/validate` - Validate emails
- `GET /api/subscription` - Get subscription status
- `POST /api/subscription` - Upgrade subscription

## Database

The system uses SQLite for development. The database file is created automatically at `backend/email_validator.db`.

## Redis

Redis is used for caching and session management. Make sure Redis is running on localhost:6379.

## Environment Variables

All configuration is in `backend/.env`. For production, update the secret keys and database URL.

## Troubleshooting

1. **Redis not running:** Install Redis and start it
2. **Port conflicts:** Change ports in app.py and package.json
3. **Database errors:** Delete email_validator.db and restart
4. **CORS issues:** Check that backend is running on port 5000

## Next Steps for Production

1. Set up PostgreSQL database
2. Configure Redis Cloud
3. Set up Stripe for payments
4. Add email notifications
5. Set up monitoring and logging
6. Configure custom domain
7. Set up SSL certificates

## Support

For issues or questions, check the logs in the terminal where you started the services.
