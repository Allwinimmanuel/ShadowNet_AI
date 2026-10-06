import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
import datetime
from sqlalchemy.orm import Session
from core.database import SessionLocal, engine, Base
from models.security_event import SecurityEvent

Base.metadata.create_all(bind=engine)

def generate_mock_data(num_events=500):
    db: Session = SessionLocal()
    
    locations = ["US-East", "US-West", "EU-Central", "Asia-East", "South-America"]
    devices = ["MacBook Pro", "Windows PC", "iPhone", "Android", "Linux Server"]
    users = [f"user_{i}" for i in range(1, 21)]
    ips = [f"192.168.1.{i}" for i in range(1, 50)] + ["10.0.0.5", "172.16.0.4", "45.33.22.11"]
    
    now = datetime.datetime.now()
    
    events_to_add = []
    
    for i in range(num_events):
        # Time generation - simulate past 24 hours
        time_offset = random.randint(0, 24 * 60 * 60)
        event_time = now - datetime.timedelta(seconds=time_offset)
        
        # 95% normal events, 5% anomalous
        is_anomalous = random.random() < 0.05
        
        user_id = random.choice(users)
        
        if not is_anomalous:
            # Normal behavior
            event_type = random.choice(["LOGIN", "FILE_READ", "PROCESS_START", "LOGOUT"])
            login_status = "SUCCESS" if event_type == "LOGIN" else "N/A"
            failed_attempts = 0 if login_status == "SUCCESS" else random.randint(0, 1)
            data_download_mb = random.uniform(0.1, 5.0)
            files_accessed = random.randint(0, 10)
            process_activity = random.uniform(10.0, 30.0)
            ip_address = random.choice(ips[:-3]) # Use normal internal IPs
            anomaly_score = random.uniform(0.01, 0.2)
            predicted_threat = "NONE"
            threat_confidence = 0.0
            risk_score = random.uniform(1.0, 15.0)
        else:
            # Anomalous behavior
            event_type = random.choice(["LOGIN_FAILED", "MASS_FILE_DOWNLOAD", "PRIVILEGE_ESCALATION", "UNUSUAL_PROCESS"])
            login_status = "FAILED" if "LOGIN" in event_type else "SUCCESS"
            failed_attempts = random.randint(3, 15) if login_status == "FAILED" else 0
            data_download_mb = random.uniform(500.0, 5000.0) if event_type == "MASS_FILE_DOWNLOAD" else random.uniform(0.1, 2.0)
            files_accessed = random.randint(100, 1000) if event_type == "MASS_FILE_DOWNLOAD" else random.randint(1, 5)
            process_activity = random.uniform(80.0, 100.0) if event_type == "UNUSUAL_PROCESS" else random.uniform(10.0, 40.0)
            ip_address = random.choice(ips[-3:]) # Use external/suspicious IPs
            anomaly_score = random.uniform(0.7, 0.99)
            
            threats = ["Brute Force", "Data Exfiltration", "Insider Threat", "Ransomware"]
            predicted_threat = random.choice(threats)
            threat_confidence = random.uniform(0.6, 0.95)
            risk_score = random.uniform(70.0, 99.0)
        
        event = SecurityEvent(
            timestamp=event_time.isoformat(),
            user_id=user_id,
            username=f"{user_id}_account",
            ip_address=ip_address,
            location=random.choice(locations),
            device=random.choice(devices),
            event_type=event_type,
            login_status=login_status,
            failed_attempts=failed_attempts,
            data_download_mb=data_download_mb,
            files_accessed=files_accessed,
            file_modifications=random.randint(0, 50) if is_anomalous else random.randint(0, 2),
            process_activity=process_activity,
            anomaly_score=anomaly_score,
            predicted_threat=predicted_threat,
            threat_confidence=threat_confidence,
            risk_score=risk_score
        )
        
        events_to_add.append(event)
        
    db.add_all(events_to_add)
    db.commit()
    db.close()
    print(f"Successfully generated {num_events} security events.")

if __name__ == "__main__":
    generate_mock_data(1000)
