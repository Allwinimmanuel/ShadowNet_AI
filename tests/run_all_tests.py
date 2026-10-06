import os
import sys
import datetime
from pathlib import Path

# Add the backend directory to sys.path so we can import app
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent / 'backend'
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from app.main import app, get_db
# pyrefly: ignore [missing-import]
from app.database import Base
# pyrefly: ignore [missing-import]
from app import models
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Ensure clean DB for testing
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Populate test user
db = TestingSessionLocal()
import bcrypt
test_password = "Demo@123".encode('utf-8')
hashed = bcrypt.hashpw(test_password, bcrypt.gensalt()).decode('utf-8')
test_user = models.User(user_id="USR001", username="USR001", password_hash=hashed, status="ACTIVE")
db.add(test_user)
db.commit()
db.close()

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    print("PASS - Health Endpoint")

def test_1_normal_login():
    res = client.post("/api/auth/login", json={"username": "USR001", "password": "Demo@123"})
    data = res.json()
    assert data["success"] == True
    assert data["prediction"] == "NORMAL"
    assert data["action"] == "ALLOWED"
    print("PASS - TEST 1 (NORMAL LOGIN)")

def test_2_suspicious_login():
    # To trigger suspicious we can mock the request somehow, or just hit analyze endpoint with suspicious payload
    res = client.post("/api/auth/analyze", json={
        "user_id": "USR002_SUSP",
        "email": "usr002@demo.com",
        "ip_address": "185.220.101.45",
        "device_type": "Unknown Device",
        "browser": "Unknown Browser",
        "location": "Unknown",
        "login_hour": 3, # 3 AM
        "day_of_week": 1,
        "failed_attempts": 3,
        "login_frequency": 2,
        "is_new_ip": 1,
        "is_new_device": 1,
        "location_changed": 1
    })
    data = res.json()
    assert data["prediction"] == "SUSPICIOUS"
    assert data["recommended_action"] == "FLAG_SUSPICIOUS"
    print(f"Risk Score was: {data['risk_score']}")
    print("PASS - TEST 2 (SUSPICIOUS LOGIN)")

def test_3_brute_force():
    # Attempt 4 wrong passwords, 5th triggers lock
    for i in range(4):
        client.post("/api/auth/login", json={"username": "USR001", "password": "wrongpassword"})
        
    res = client.post("/api/auth/login", json={"username": "USR001", "password": "wrongpassword"})
    data = res.json()
    assert data["prediction"] == "BRUTE_FORCE"
    assert data["action"] == "ACCOUNT_LOCKED"
    assert data["risk_score"] >= 90
    print("PASS - TEST 3 (BRUTE FORCE)")

def test_5_already_locked():
    res = client.post("/api/auth/login", json={"username": "USR001", "password": "Demo@123"})
    data = res.json()
    assert data["prediction"] == "BRUTE_FORCE"
    assert data["action"] == "ACCOUNT_LOCKED"
    assert data["success"] == False
    print("PASS - TEST 5 (ALREADY LOCKED ACCOUNT)")

def test_4_high_freq():
    # Attempt 10 times from same IP
    for i in range(10):
        client.post("/api/auth/analyze", json={
            "user_id": "U1001",
            "email": "u1001@demo.com",
            "ip_address": "8.8.8.8",
            "device_type": "Desktop",
            "browser": "Chrome",
            "location": "Unknown",
            "login_hour": 10,
            "day_of_week": 1,
            "failed_attempts": 0,
            "login_frequency": i+1,
            "is_new_ip": 0,
            "is_new_device": 0,
            "location_changed": 0
        })
    
    res = client.post("/api/auth/analyze", json={
        "user_id": "U1001",
        "email": "u1001@demo.com",
        "ip_address": "8.8.8.8",
        "device_type": "Desktop",
        "browser": "Chrome",
        "location": "Unknown",
        "login_hour": 10,
        "day_of_week": 1,
        "failed_attempts": 0,
        "login_frequency": 11,
        "is_new_ip": 0,
        "is_new_device": 0,
        "location_changed": 0
    })
    data = res.json()
    assert data["prediction"] == "BLOCKED_IP"
    assert data["recommended_action"] == "BLOCK_IP"
    assert data["risk_score"] >= 90
    print("PASS - TEST 4 (HIGH FREQUENCY IP ATTACK)")

def test_6_already_blocked():
    res = client.post("/api/auth/analyze", json={
        "user_id": "U1001",
        "email": "u1001@demo.com",
        "ip_address": "8.8.8.8",
        "device_type": "Desktop",
        "browser": "Chrome",
        "location": "Unknown",
        "login_hour": 10,
        "day_of_week": 1,
        "failed_attempts": 0,
        "login_frequency": 12,
        "is_new_ip": 0,
        "is_new_device": 0,
        "location_changed": 0
    })
    data = res.json()
    assert data["prediction"] == "BLOCKED_IP"
    assert data["recommended_action"] == "BLOCKED_AND_DENIED"
    print("PASS - TEST 6 (ALREADY BLOCKED IP)")

def test_7_wrong_password():
    # Make a new user to avoid lock
    db = TestingSessionLocal()
    test_user2 = models.User(user_id="USR002", username="USR002", password_hash=hashed, status="ACTIVE")
    db.add(test_user2)
    db.commit()
    db.close()
    
    res = client.post("/api/auth/login", json={"username": "USR002", "password": "wrongpassword"})
    data = res.json()
    assert data["success"] == False
    assert data["action"] == "DENIED"
    assert "Credentials were invalid" in data["message"] or "Invalid username or password" in data["message"]
    print("PASS - TEST 7 (NORMAL WRONG PASSWORD)")


if __name__ == "__main__":
    test_health()
    test_1_normal_login()
    test_2_suspicious_login()
    test_3_brute_force()
    test_5_already_locked()
    test_4_high_freq()
    test_6_already_blocked()
    test_7_wrong_password()
    print("ALL TESTS PASSED SUCCESSFULLY!")
