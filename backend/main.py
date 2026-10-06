from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from core.database import engine, Base, get_db
from models import security_event as models
from schemas import security_event as schemas

import pickle
import pandas as pd
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ShadowNet AI API")

# Load ML Model
model_artifact = None
try:
    model_path = os.path.join(os.path.dirname(__file__), "ml", "isolation_forest.pkl")
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            model_artifact = pickle.load(f)
        print("ML Model loaded successfully.")
    else:
        print("Warning: ML model not found. Run training script first.")
except Exception as e:
    print(f"Failed to load ML model: {e}")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ShadowNet AI Backend is running"}

@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_events = db.query(func.count(models.SecurityEvent.id)).scalar() or 0
    high_risk = db.query(func.count(models.SecurityEvent.id)).filter(models.SecurityEvent.risk_score > 70).scalar() or 0
    high_risk_users = db.query(models.SecurityEvent.user_id).filter(models.SecurityEvent.risk_score > 70).distinct().count()
    suspicious_ips = db.query(models.SecurityEvent.ip_address).filter(models.SecurityEvent.risk_score > 70).distinct().count()
    avg_risk = db.query(func.avg(models.SecurityEvent.risk_score)).scalar() or 0
    
    threat_level = "CRITICAL" if avg_risk > 80 else "HIGH" if avg_risk > 50 else "MEDIUM" if avg_risk > 20 else "LOW"
    
    return {
        "risk_score": round(float(avg_risk), 1),
        "threat_level": threat_level,
        "events_analyzed": total_events,
        "high_risk_events": high_risk,
        "high_risk_users": high_risk_users,
        "suspicious_ips": suspicious_ips
    }

@app.get("/api/logs", response_model=list[schemas.SecurityEvent])
def get_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(models.SecurityEvent).offset(skip).limit(limit).all()
    return events

@app.post("/api/analyze", response_model=schemas.SecurityEvent)
def analyze_event(event: schemas.SecurityEventCreate, db: Session = Depends(get_db)):
    if model_artifact:
        try:
            model = model_artifact['model']
            scaler = model_artifact['scaler']
            le_event = model_artifact['le_event']
            le_login = model_artifact['le_login']
            features = model_artifact['features']
            
            # Safe transform with fallback for unseen labels
            event_type_enc = le_event.transform([event.event_type])[0] if event.event_type in le_event.classes_ else 0
            login_status_enc = le_login.transform([event.login_status])[0] if event.login_status in le_login.classes_ else 0
            
            df = pd.DataFrame([{
                'event_type_encoded': event_type_enc,
                'login_status_encoded': login_status_enc,
                'failed_attempts': event.failed_attempts,
                'data_download_mb': event.data_download_mb,
                'files_accessed': event.files_accessed,
                'process_activity': event.process_activity,
                'file_modifications': event.file_modifications
            }])
            
            X_scaled = scaler.transform(df[features])
            
            # Get prediction (-1 for anomaly, 1 for normal)
            prediction = model.predict(X_scaled)[0]
            raw_score = model.decision_function(X_scaled)[0] 
            normalized_score = max(0, min(1, 0.5 - (raw_score / 2)))
            
            is_anomaly = prediction == -1
        except Exception as e:
            print(f"Prediction failed: {e}")
            is_anomaly = False
            normalized_score = 0.0
    else:
        is_anomaly = False
        normalized_score = 0.0
        
    db_event = models.SecurityEvent(
        **event.dict(),
        anomaly_score=normalized_score,
        predicted_threat="UNKNOWN_ANOMALY" if is_anomaly else "NONE",
        threat_confidence=normalized_score if is_anomaly else 0.0,
        risk_score=normalized_score * 100
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event
