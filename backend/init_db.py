#!/usr/bin/env python3
"""
Database initialization script for Email Validator
Creates and initializes the database with proper schema
"""

import os
import sys
from datetime import datetime
from app import app, db, User, ValidationJob, bcrypt, PLANS

def init_database():
    """Initialize the database with proper schema"""
    print("🚀 Initializing Email Validator Database...")
    
    with app.app_context():
        try:
            # Drop all tables if they exist (for clean setup)
            print("📥 Dropping existing tables...")
            db.drop_all()
            
            # Create all tables
            print("📤 Creating new tables...")
            db.create_all()
            
            # Create sample admin user for testing
            print("👤 Creating sample admin user...")
            admin_password = "Admin123!"
            admin_user = User(
                email="admin@emailvalidator.com",
                password_hash=bcrypt.generate_password_hash(admin_password).decode('utf-8'),
                plan="enterprise",
                emails_used=0,
                emails_limit=PLANS['enterprise']['emails_limit'],
                is_active=True,
                email_verified=True,
                last_login=datetime.utcnow()
            )
            db.session.add(admin_user)
            
            # Create sample test user
            print("👤 Creating sample test user...")
            test_password = "Test123!"
            test_user = User(
                email="test@example.com",
                password_hash=bcrypt.generate_password_hash(test_password).decode('utf-8'),
                plan="starter",
                emails_used=50,
                emails_limit=PLANS['starter']['emails_limit'],
                is_active=True,
                email_verified=True
            )
            db.session.add(test_user)
            
            # Commit all changes
            db.session.commit()
            
            print("✅ Database initialized successfully!")
            print("\n📋 Sample User Accounts Created:")
            print(f"   Admin: admin@emailvalidator.com (Password: {admin_password})")
            print(f"   Test:  test@example.com (Password: {test_password})")
            print("\n🎯 Database Features:")
            print("   • Enhanced user model with email verification")
            print("   • Improved validation job tracking")
            print("   • Role-based email detection")
            print("   • Deliverability scoring")
            print("   • Indexed fields for better performance")
            print("\n💡 Next steps:")
            print("   1. Start the backend: python app.py")
            print("   2. Start the frontend: npm start")
            print("   3. Open http://localhost:3000")
            
        except Exception as e:
            print(f"❌ Error initializing database: {str(e)}")
            db.session.rollback()
            sys.exit(1)

def verify_database():
    """Verify database structure and show table info"""
    print("\n🔍 Verifying Database Structure...")
    
    with app.app_context():
        try:
            # Check if tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"📊 Found {len(tables)} tables: {', '.join(tables)}")
            
            # Show user count
            user_count = User.query.count()
            print(f"👥 Users in database: {user_count}")
            
            # Show validation jobs count
            job_count = ValidationJob.query.count()
            print(f"💼 Validation jobs: {job_count}")
            
            # Show plan configurations
            print(f"\n💰 Available Plans: {len(PLANS)}")
            for plan_id, plan_info in PLANS.items():
                print(f"   • {plan_info['name']}: {plan_info['emails_limit']} emails/month")
            
            print("✅ Database verification complete!")
            
        except Exception as e:
            print(f"❌ Error verifying database: {str(e)}")

def reset_user_usage():
    """Reset usage for all users (monthly reset simulation)"""
    print("\n🔄 Resetting user usage...")
    
    with app.app_context():
        try:
            users = User.query.all()
            for user in users:
                if user.plan == 'free':
                    user.emails_used = 0
                elif user.plan in ['professional', 'enterprise']:
                    user.emails_used = 0
                # Starter plan users keep some usage for demo
                db.session.commit()
            
            print(f"✅ Reset usage for {len(users)} users")
            
        except Exception as e:
            print(f"❌ Error resetting usage: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "init":
            init_database()
        elif command == "verify":
            verify_database()
        elif command == "reset":
            reset_user_usage()
        elif command == "all":
            init_database()
            verify_database()
        else:
            print("Usage: python init_db.py [init|verify|reset|all]")
            print("  init   - Initialize database with fresh schema")
            print("  verify - Verify database structure")
            print("  reset  - Reset user usage counters")
            print("  all    - Initialize and verify")
    else:
        # Default: initialize database
        init_database()
        verify_database() 