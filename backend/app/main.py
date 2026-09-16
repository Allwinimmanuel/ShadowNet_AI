from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import json
import os
from typing import List
from pydantic import BaseModel
import datetime
import bcrypt

from . import models, schemas, database, prevention, ml_service, threat_intel, ueba, phishing

# Create tables
models.Base.metadata.create_all(bind=database.engine)

import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        ml_service.load_model()
    except Exception as e:
        logger.error(f"Failed to load model: {e}. Generate it using the model training script.")
    yield

app = FastAPI(title="ShadowNet AI: Login Attack Detection", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Dependency
get_db = database.get_db

@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    model_loaded = ml_service.model is not None
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        pass
        
    return {
        "status": "healthy",
        "service": "ShadowNet AI",
        "model_loaded": model_loaded,
        "database_connected": db_connected
    }

@app.post("/api/auth/login")
def login(request_data: schemas.SimpleLoginRequest, req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "127.0.0.1"
    user_agent = req.headers.get("user-agent", "Unknown")
    
    # Simple browser/os parsing
    browser = "Chrome" if "Chrome" in user_agent else ("Firefox" if "Firefox" in user_agent else "Unknown")
    device = "Mobile" if "Mobile" in user_agent else "Desktop"
    
    # 1. Fetch user
    user = db.query(models.User).filter(models.User.username == request_data.username).first()
    if not user:
        # Prevent user enumeration, but ensure counters are distinct per username
        user_id = request_data.username
        email = f"{request_data.username}@demo.com"
        password_valid = False
    else:
        user_id = user.user_id
        email = f"{user.username}@demo.com"
        password_valid = bcrypt.checkpw(request_data.password.encode('utf-8'), user.password_hash.encode('utf-8'))
        
    # Get previous attempts
    time_limit = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    recent_attempts = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.user_id == user_id,
        models.LoginAttempt.created_at >= time_limit
    ).order_by(models.LoginAttempt.created_at.desc()).all()
    
    # Calculate consecutive failed attempts since last successful login
    failed_attempts = 0
    for attempt in recent_attempts:
        if attempt.successful_login:
            break
        failed_attempts += 1
    
    # Build complete request for ML
    full_req = schemas.LoginRequest(
        user_id=user_id,
        email=email,
        ip_address=ip,
        device_type=device,
        browser=browser,
        location="Unknown",
        login_hour=datetime.datetime.utcnow().hour,
        day_of_week=datetime.datetime.utcnow().weekday(),
        failed_attempts=failed_attempts,
        login_frequency=len(recent_attempts) + 1,
        is_new_ip=0, # Need history check in a real app
        is_new_device=0,
        location_changed=0
    )
    
    # 1. Get ML Prediction
    ml_result = ml_service.analyze_login(full_req.model_dump())
    
    # 2. Apply Prevention Rules
    action, prediction, risk_score = prevention.evaluate_and_prevent(
        db=db, 
        request=full_req, 
        prediction=ml_result["prediction"], 
        risk_score=ml_result["risk_score"], 
        reasons=ml_result["reasons"]
    )
    
    # 3. Verify password
    if not password_valid:
        risk_score = min(100.0, risk_score + 25.0)
        
    # 4. Store login attempt
    db_attempt = models.LoginAttempt(
        user_id=user_id,
        ip_address=ip,
        device_type=device,
        browser=browser,
        location="Unknown",
        login_hour=datetime.datetime.utcnow().hour,
        successful_login=password_valid and action not in ["BLOCK_IP", "LOCK_ACCOUNT"],
        failed_attempts=failed_attempts + 1 if not password_valid else 0,
        risk_score=risk_score,
        prediction=prediction,
        action_taken=action
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    # Logging
    print(f"LOGIN ATTEMPT -> username: {request_data.username}, failed_attempts: {failed_attempts}, prediction: {prediction}, action: {action}, account_locked: {action == 'LOCK_ACCOUNT'}, ip_blocked: {action == 'BLOCK_IP'}")
    
    if action == "BLOCK_IP":
        raise HTTPException(status_code=403, detail="IP address is blocked.")
    elif action == "LOCK_ACCOUNT":
        raise HTTPException(status_code=403, detail="Account is temporarily locked.")
    elif action == "BLOCK_AND_VERIFY":
        raise HTTPException(status_code=403, detail="Login blocked for security reasons.")
    elif not password_valid:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
        
    return {
        "status": "success",
        "message": "Login successful.",
        "user_id": user_id,
        "prediction": prediction,
        "risk_score": risk_score
    }

@app.post("/api/auth/analyze", response_model=schemas.PredictionResponse)
def analyze_login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Get ML Prediction
    ml_result = ml_service.analyze_login(request.model_dump())
    
    # 2. Apply Prevention Rules
    action, prediction, risk_score = prevention.evaluate_and_prevent(
        db=db, 
        request=request, 
        prediction=ml_result["prediction"], 
        risk_score=ml_result["risk_score"], 
        reasons=ml_result["reasons"]
    )
    
    # 3. Store login attempt
    db_attempt = models.LoginAttempt(
        user_id=request.user_id,
        ip_address=request.ip_address,
        device_type=request.device_type,
        browser=request.browser,
        location=request.location,
        login_hour=request.login_hour,
        successful_login=(action == "ALLOW_LOGIN"),
        failed_attempts=request.failed_attempts,
        risk_score=risk_score,
        prediction=prediction,
        action_taken=action
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    return schemas.PredictionResponse(
        prediction=prediction,
        risk_score=risk_score,
        confidence=ml_result["confidence"],
        reasons=ml_result["reasons"],
        recommended_action=action
    )

@app.get("/api/dashboard/summary", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    BLOCKED_ACTIONS = ["BLOCK_IP", "LOCK_ACCOUNT"]
    total = db.query(models.LoginAttempt).count()
    
    # Normal: action_taken == ALLOW_LOGIN
    normal = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.action_taken == "ALLOW_LOGIN"
    ).count()
    
    # Suspicious: action_taken == FLAG_SUSPICIOUS
    suspicious = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.action_taken == "FLAG_SUSPICIOUS"
    ).count()
    
    # Blocked: action_taken in ["BLOCK_IP", "LOCK_ACCOUNT"]
    blocked = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.action_taken.in_(BLOCKED_ACTIONS)
    ).count()
    
    # Active incidents: status == OPEN
    active_incidents = db.query(models.SecurityIncident).filter(
        models.SecurityIncident.status == "OPEN"
    ).count()
    
    return {
        "total_attempts": total,
        "normal_logins": normal,
        "suspicious_logins": suspicious,
        "blocked_attempts": blocked,
        "active_incidents": active_incidents
    }

@app.get("/api/login-attempts")
def get_login_attempts(db: Session = Depends(get_db)):
    return db.query(models.LoginAttempt).order_by(models.LoginAttempt.created_at.desc()).limit(100).all()

@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    return db.query(models.SecurityIncident).order_by(models.SecurityIncident.created_at.desc()).limit(100).all()

@app.patch("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.SecurityIncident).filter(models.SecurityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    incident.status = "RESOLVED"
    incident.resolved = True
    db.commit()
    db.refresh(incident)
    return {"status": "success", "message": f"Incident {incident_id} resolved.", "incident": incident}

@app.post("/api/incidents/resolve-all")
def resolve_all_incidents(db: Session = Depends(get_db)):
    open_incidents = db.query(models.SecurityIncident).filter(models.SecurityIncident.status == "OPEN").all()
    for inc in open_incidents:
        inc.status = "RESOLVED"
        inc.resolved = True
    db.commit()
    return {"status": "success", "message": f"Resolved {len(open_incidents)} incidents."}

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).limit(50).all()

@app.get("/api/prevention/status")
def get_prevention_status(db: Session = Depends(get_db)):
    locked = db.query(models.AccountLock).all()
    blocked = db.query(models.BlockedIP).all()
    return {
        "locked_accounts": locked,
        "blocked_ips": blocked
    }

class UnlockRequest(BaseModel):
    user_id: str

@app.post("/api/prevention/unlock-account")
def unlock_account(req: UnlockRequest, db: Session = Depends(get_db)):
    lock = db.query(models.AccountLock).filter(models.AccountLock.user_id == req.user_id).first()
    if lock:
        db.delete(lock)
        db.commit()
        return {"status": "success", "message": f"Account {req.user_id} unlocked."}
    raise HTTPException(status_code=404, detail="Account lock not found.")

class UnblockRequest(BaseModel):
    ip_address: str

@app.post("/api/prevention/unblock-ip")
def unblock_ip(req: UnblockRequest, db: Session = Depends(get_db)):
    block = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == req.ip_address).first()
    if block:
        db.delete(block)
        db.commit()
        return {"status": "success", "message": f"IP {req.ip_address} unblocked."}
    raise HTTPException(status_code=404, detail="IP block not found.")

class LockAccountRequest(BaseModel):
    user_id: str
    reason: str = "Manually locked by administrator"

@app.post("/api/prevention/lock-account")
def lock_account_manual(req: LockAccountRequest, db: Session = Depends(get_db)):
    existing = db.query(models.AccountLock).filter(models.AccountLock.user_id == req.user_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Account {req.user_id} is already locked.")
    lock = models.AccountLock(user_id=req.user_id, reason=req.reason)
    db.add(lock)
    # Create security incident
    incident = models.SecurityIncident(
        threat_type="Manual Account Lock",
        severity="HIGH",
        description=f"Account {req.user_id} manually locked by administrator. Reason: {req.reason}",
        prevention_action="LOCK_ACCOUNT",
        status="OPEN"
    )
    db.add(incident)
    db.commit()
    return {"status": "success", "message": f"Account {req.user_id} locked."}

class BlockIPRequest(BaseModel):
    ip_address: str
    reason: str = "Manually blocked by administrator"

@app.post("/api/prevention/block-ip")
def block_ip_manual(req: BlockIPRequest, db: Session = Depends(get_db)):
    existing = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == req.ip_address).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"IP {req.ip_address} is already blocked.")
    block = models.BlockedIP(ip_address=req.ip_address, reason=req.reason)
    db.add(block)
    # Create security incident
    incident = models.SecurityIncident(
        threat_type="Manual IP Block",
        severity="HIGH",
        description=f"IP {req.ip_address} manually blocked by administrator. Reason: {req.reason}",
        prevention_action="BLOCK_IP",
        status="OPEN"
    )
    db.add(incident)
    db.commit()
    return {"status": "success", "message": f"IP {req.ip_address} blocked."}

@app.get("/api/model/metrics")
def get_model_metrics():
    metadata_path = os.path.join(os.path.dirname(__file__), "..", "models", "model_metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return {"message": "Model metadata not found."}


# ════════════════════════════════════════════════════════════════════
# THREAT INTELLIGENCE ENDPOINTS
# ════════════════════════════════════════════════════════════════════

@app.get("/api/threat/prediction")
def get_threat_prediction(db: Session = Depends(get_db)):
    """Sequence-based AI threat prediction from recent login events."""
    return threat_intel.get_threat_prediction(db)

@app.get("/api/threat/risk-scores")
def get_risk_scores(db: Session = Depends(get_db)):
    """Entity risk scores for users and IPs over the last 7 days."""
    return threat_intel.get_entity_risk_scores(db)

@app.get("/api/threat/attack-paths")
def get_attack_paths(db: Session = Depends(get_db)):
    """Attack path graph nodes, edges, and incident chains."""
    return threat_intel.get_attack_paths(db)

@app.post("/api/threat/explain")
def explain_prediction_endpoint(request: schemas.LoginRequest):
    """Explain an ML prediction with ranked feature contributions."""
    data = request.model_dump()
    ml_result = ml_service.analyze_login(data)
    explanation = ml_service.explain_prediction(data)
    attack_cat  = ml_service.categorize_attack(ml_result["risk_score"], ml_result["reasons"], data)
    return {
        "prediction":      ml_result["prediction"],
        "risk_score":      ml_result["risk_score"],
        "confidence":      ml_result["confidence"],
        "attack_category": attack_cat,
        "explanation":     explanation,
        "reasons":         ml_result["reasons"],
    }


# ════════════════════════════════════════════════════════════════════
# UEBA ENDPOINTS
# ════════════════════════════════════════════════════════════════════

@app.get("/api/ueba/anomalies")
def get_ueba_anomalies(db: Session = Depends(get_db)):
    """All users with behavioural anomalies in the last 24 hours."""
    return ueba.get_all_anomalies(db)

@app.get("/api/ueba/baseline/{user_id}")
def get_ueba_baseline(user_id: str, db: Session = Depends(get_db)):
    """Behavioural baseline for a specific user."""
    return ueba.get_user_baseline(db, user_id)

@app.get("/api/ueba/user/{user_id}")
def get_ueba_user_report(user_id: str, db: Session = Depends(get_db)):
    """Full UEBA report for a specific user (baseline + recent events + anomalies)."""
    return ueba.get_user_ueba_report(db, user_id)


# ════════════════════════════════════════════════════════════════════
# PHISHING ANALYSIS ENDPOINT
# ════════════════════════════════════════════════════════════════════

class PhishingRequest(BaseModel):
    email_text: str

@app.post("/api/phishing/analyze")
def analyze_phishing(req: PhishingRequest):
    """Heuristic phishing analysis — fully offline."""
    return phishing.analyze_email(req.email_text)


