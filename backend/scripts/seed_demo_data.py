import sys
import os
from datetime import datetime, timedelta
import random

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app import models
from app.database import engine, SessionLocal
import bcrypt

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_data():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Create demo user
        user = db.query(models.User).filter(models.User.username == "USR001").first()
        if not user:
            user = models.User(
                user_id="U1001",
                username="USR001",
                password_hash=get_password_hash("Demo@123"),
                status="ACTIVE"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("Created demo user USR001")
            
        # Create some historical login attempts to simulate normal behavior
        existing_attempts = db.query(models.LoginAttempt).count()
        if existing_attempts == 0:
            print("Seeding historical login data...")
            now = datetime.now()
            for i in range(50):
                # Normal logins over the past 30 days
                days_ago = random.randint(1, 30)
                hour = random.randint(9, 18) # Normal working hours
                
                attempt_time = now - timedelta(days=days_ago, hours=(now.hour - hour))
                
                attempt = models.LoginAttempt(
                    user_id="U1001",
                    ip_address="192.168.1.100", # Familiar IP
                    device_type="desktop",
                    browser="Chrome",
                    operating_system="Windows 10",
                    location="New York, USA",
                    login_hour=hour,
                    login_time=attempt_time,
                    successful_login=True,
                    failed_attempts=0,
                    risk_score=0.1,
                    risk_level="LOW",
                    prediction="NORMAL",
                    attack_type=None,
                    action_taken="ALLOWED",
                    created_at=attempt_time
                )
                db.add(attempt)
                
            db.commit()
            print("Successfully seeded historical data.")
        else:
            print(f"Historical data already exists ({existing_attempts} records).")
            
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
