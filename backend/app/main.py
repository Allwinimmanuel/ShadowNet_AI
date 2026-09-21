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
import io
import csv
from fastapi.responses import StreamingResponse
from . import models, schemas, database, prevention, ml_service, threat_intel, ueba, phishing, auth

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
    # 1. Fetch user
    user = db.query(models.User).filter(models.User.username == request_data.username).first()
    if not user:
        return {"success": False, "message": "Invalid username or password."}
        
    password_valid = bcrypt.checkpw(request_data.password.encode('utf-8'), user.password_hash.encode('utf-8'))
    
    if not password_valid:
        return {"success": False, "message": "Invalid username or password."}
        
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})

    return {
        "success": True,
        "message": "Login successful.",
        "user_id": user.user_id,
        "token": access_token
    }

@app.post("/api/auth/analyze", response_model=schemas.PredictionResponse)
def analyze_login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Calculate consecutive failed attempts from history
    time_limit = datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
    recent_attempts = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.user_id == request.user_id,
        models.LoginAttempt.created_at >= time_limit
    ).order_by(models.LoginAttempt.created_at.desc()).all()
    
    true_failed_attempts = 0
    for attempt in recent_attempts:
        if attempt.successful_login:
            break
        true_failed_attempts += 1
        
    # Override request failed attempts with the true historical count
    request.failed_attempts = true_failed_attempts

    # 1. Get ML Prediction
    ml_result = ml_service.analyze_login(request.model_dump())
    
    # Pre-adjust risk score for bad passwords BEFORE prevention engine
    adjusted_risk_score = ml_result["risk_score"]
    if not request.is_password_valid:
        adjusted_risk_score = min(100.0, adjusted_risk_score + 25.0)
        if "Invalid password" not in ml_result["reasons"]:
            ml_result["reasons"].append("Invalid password")
    
    # 2. Apply Prevention Rules
    action, prediction, risk_score, reasons = prevention.evaluate_and_prevent(
        db=db, 
        request=request, 
        prediction=ml_result["prediction"], 
        risk_score=adjusted_risk_score, 
        reasons=ml_result["reasons"]
    )
    
    if not request.is_password_valid and action == "ALLOWED":
        action = "DENIED"
    
    # 3. Store login attempt
    db_attempt = models.LoginAttempt(
        user_id=request.user_id,
        ip_address=request.ip_address,
        device_type=request.device_type,
        browser=request.browser,
        location=request.location,
        login_hour=request.login_hour,
        successful_login=(request.is_password_valid and action == "ALLOWED"),
        failed_attempts=request.failed_attempts,
        risk_score=risk_score,
        prediction=prediction,
        action_taken=action,
        explanation=json.dumps(reasons) if reasons else None,
        model_confidence=ml_result.get("confidence")
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

@app.post("/api/transactions/analyze")
def analyze_transaction(request: dict, db: Session = Depends(get_db)):
    """
    Evaluates transaction risk based on amount, velocity, context, etc.
    Returns LOW RISK, SUSPICIOUS, or HIGH RISK.
    """
    risk_score = 0.0
    reasons = []
    
    amount = request.get("amount", 0)
    failed_attempts = request.get("recent_failed_authentication_count", 0)
    user_id = request.get("user_id", "Unknown")
    
    if amount > 10000:
        risk_score += 40
        reasons.append("Unusually high transaction amount")
    if failed_attempts > 0:
        risk_score += 30
        reasons.append("Recent failed authentications")
        
    if risk_score >= 70:
        decision = "HIGH RISK"
        action = "BLOCKED"
        severity = "HIGH"
    elif risk_score >= 30:
        decision = "SUSPICIOUS"
        action = "HELD"
        severity = "MEDIUM"
    else:
        decision = "LOW RISK"
        action = "ALLOWED"
        severity = None
        
    # Generate a mock security decision ID
    import uuid
    decision_id = f"SEC-{uuid.uuid4().hex[:8].upper()}"
    
    if severity:
        # Create an Incident and Alert for Suspicious/High Risk transactions
        description = f"Transaction of ${amount} for user {user_id} flagged as {decision}. Reasons: {', '.join(reasons)}"
        
        incident = models.SecurityIncident(
            login_attempt_id=None,
            threat_type="HIGH_RISK_TRANSACTION",
            username=user_id,
            ip_address=None,
            severity=severity,
            description=description,
            prevention_action=action,
            status="OPEN"
        )
        db.add(incident)
        
        alert = models.Alert(
            type=severity,
            message=f"High Risk Transaction: {description}"
        )
        db.add(alert)
        db.commit()
    
    return {
        "security_decision_id": decision_id,
        "decision": decision,
        "recommended_action": action,
        "risk_score": risk_score,
        "reasons": reasons
    }


@app.get("/api/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.require_admin),
    start_date: str = None,
    end_date: str = None
):
    BLOCKED_ACTIONS = ["ACCOUNT_LOCKED", "BLOCK_IP", "BLOCKED_AND_DENIED"]
    
    query = db.query(models.LoginAttempt)
    incident_query = db.query(models.SecurityIncident)
    
    if start_date:
        from dateutil.parser import parse
        try:
            sd = parse(start_date)
            query = query.filter(models.LoginAttempt.created_at >= sd)
            incident_query = incident_query.filter(models.SecurityIncident.created_at >= sd)
        except: pass
    if end_date:
        from dateutil.parser import parse
        try:
            ed = parse(end_date)
            query = query.filter(models.LoginAttempt.created_at <= ed)
            incident_query = incident_query.filter(models.SecurityIncident.created_at <= ed)
        except: pass
        
    total = query.count()
    allowed = query.filter(models.LoginAttempt.action_taken == "ALLOWED").count()
    denied = query.filter(models.LoginAttempt.action_taken == "DENIED").count()
    blocked = query.filter(models.LoginAttempt.action_taken.in_(BLOCKED_ACTIONS)).count()
    suspicious = query.filter(models.LoginAttempt.action_taken == "FLAG_SUSPICIOUS").count()
    
    active_incidents = incident_query.filter(models.SecurityIncident.status.in_(["OPEN", "INVESTIGATING"])).count()
    open_incidents = active_incidents
    resolved_incidents = incident_query.filter(models.SecurityIncident.status == "RESOLVED").count()

    successful_logins = query.filter(models.LoginAttempt.successful_login == True).count()
    failed_attempts = query.filter(models.LoginAttempt.successful_login == False).count()

    return {
        "total_attempts": total,
        "allowed_logins": allowed,
        "denied_logins": denied,
        "blocked_logins": blocked,
        "suspicious_activity": suspicious,
        "active_incidents": active_incidents,
        "open_incidents": open_incidents,
        "resolved_incidents": resolved_incidents,
        "failed_attempts": failed_attempts,
        "successful_logins": successful_logins
    }

@app.get("/api/login-attempts")
def get_login_attempts(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return db.query(models.LoginAttempt).order_by(models.LoginAttempt.created_at.desc()).limit(100).all()

@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return db.query(models.SecurityIncident).order_by(models.SecurityIncident.created_at.desc()).limit(100).all()

@app.patch("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    incident = db.query(models.SecurityIncident).filter(models.SecurityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    incident.status = "RESOLVED"
    incident.resolved = True
    db.commit()
    db.refresh(incident)
    return {"status": "success", "message": f"Incident {incident_id} resolved.", "incident": incident}

@app.post("/api/incidents/resolve-all")
def resolve_all_incidents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    open_incidents = db.query(models.SecurityIncident).filter(models.SecurityIncident.status == "OPEN").all()
    for inc in open_incidents:
        inc.status = "RESOLVED"
        inc.resolved = True
    db.commit()
    return {"status": "success", "message": f"Resolved {len(open_incidents)} incidents."}

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).limit(50).all()

@app.get("/api/prevention/status")
def get_prevention_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
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
def lock_account_manual(req: LockAccountRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
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
def get_model_metrics(current_user: models.User = Depends(auth.require_admin)):
    metadata_path = os.path.join(os.path.dirname(__file__), "..", "models", "model_metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return {"message": "Model metadata not found."}


# ════════════════════════════════════════════════════════════════════
# THREAT INTELLIGENCE ENDPOINTS
# ════════════════════════════════════════════════════════════════════

@app.get("/api/threat/prediction")
def get_threat_prediction(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """Sequence-based AI threat prediction from recent login events."""
    return threat_intel.get_threat_prediction(db)

@app.get("/api/threat/risk-scores")
def get_risk_scores(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """Entity risk scores for users and IPs over the last 7 days."""
    return threat_intel.get_entity_risk_scores(db)

@app.get("/api/threat/attack-paths")
def get_attack_paths(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """Attack path graph nodes, edges, and incident chains."""
    return threat_intel.get_attack_paths(db)

@app.post("/api/threat/explain")
def explain_prediction_endpoint(request: schemas.LoginRequest, current_user: models.User = Depends(auth.require_admin)):
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
def get_ueba_anomalies(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """All users with behavioural anomalies in the last 24 hours."""
    return ueba.get_all_anomalies(db)

@app.get("/api/ueba/baseline/{user_id}")
def get_ueba_baseline(user_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """Behavioural baseline for a specific user."""
    return ueba.get_user_baseline(db, user_id)

@app.get("/api/ueba/user/{user_id}")
def get_ueba_user_report(user_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    """Full UEBA report for a specific user (baseline + recent events + anomalies)."""
    return ueba.get_user_ueba_report(db, user_id)


# ════════════════════════════════════════════════════════════════════
# PHISHING ANALYSIS ENDPOINT
# ════════════════════════════════════════════════════════════════════

class PhishingRequest(BaseModel):
    email_text: str

@app.post("/api/phishing/analyze")
def analyze_phishing(req: PhishingRequest, current_user: models.User = Depends(auth.require_admin)):
    """Heuristic phishing analysis — fully offline."""
    return phishing.analyze_email(req.email_text)

# --------------------------------------------------------------------
# NEW FEATURES: AUDIT, DEMO, EXPORT
# --------------------------------------------------------------------

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100).all()

import io
from fastapi.responses import StreamingResponse

@app.get("/api/export/logins")
def export_logins(db: Session = Depends(get_db)):
    logins = db.query(models.LoginAttempt).order_by(models.LoginAttempt.created_at.desc()).all()
    output = io.StringIO()
    output.write("id,user_id,ip_address,prediction,action_taken,risk_score,successful_login,created_at\n")
    for log in logins:
        output.write(f"{log.id},{log.user_id},{log.ip_address},{log.prediction},{log.action_taken},{log.risk_score},{log.successful_login},{log.created_at}\n")
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=logins_export.csv"
    return response

@app.get("/api/export/incidents")
def export_incidents(db: Session = Depends(get_db)):
    incidents = db.query(models.SecurityIncident).order_by(models.SecurityIncident.created_at.desc()).all()
    output = io.StringIO()
    output.write("id,threat_type,username,ip_address,severity,status,created_at\n")
    for inc in incidents:
        output.write(f"{inc.id},{inc.threat_type},{inc.username},{inc.ip_address},{inc.severity},{inc.status},{inc.created_at}\n")
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=incidents_export.csv"
    return response

@app.get("/api/export/audit-logs")
def export_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()
    output = io.StringIO()
    output.write("id,action,target_entity,admin_id,description,created_at\n")
    for log in logs:
        output.write(f"{log.id},{log.action},{log.target_entity},{log.admin_id},{log.description},{log.created_at}\n")
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=audit_logs_export.csv"
    return response

import sys
import subprocess

class DemoScenarioRequest(BaseModel):
    scenario: str

@app.post("/api/demo/scenario")
def trigger_demo_scenario(req: DemoScenarioRequest, db: Session = Depends(get_db)):
    audit = models.AuditLog(action="DEMO_SCENARIO", target_entity="System", admin_id="admin", description=f"Triggered scenario: {req.scenario}")
    db.add(audit)
    db.commit()
    
    script_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "simulate.py")
    # Run synchronously so the frontend loading spinner reflects actual progress
    subprocess.run([sys.executable, script_path, req.scenario], check=False)
    
    return {"status": "success", "message": f"Scenario '{req.scenario}' has successfully completed! Check your dashboards to view the generated data."}

@app.post("/api/demo/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    db.query(models.LoginAttempt).delete()
    db.query(models.SecurityIncident).delete()
    db.query(models.AccountLock).delete()
    db.query(models.BlockedIP).delete()
    db.query(models.AuditLog).delete()
    db.query(models.Alert).delete()
    db.commit()
    
    audit = models.AuditLog(action="DATABASE_RESET", target_entity="System", admin_id="admin", description="Reset all demo data")
    db.add(audit)
    db.commit()
    return {"status": "success", "message": "Demo data reset successfully. All databases cleared."}
