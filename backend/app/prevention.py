from sqlalchemy.orm import Session
from . import models, schemas
import datetime
import json

from .risk_engine import RiskFusionEngine

def evaluate_and_prevent(db: Session, request: schemas.LoginRequest, prediction: str, risk_score: float, reasons: list, dry_run: bool = False):
    engine = RiskFusionEngine(db)
    req_dict = request.model_dump()
    res = engine.evaluate(req_dict, is_password_valid=request.is_password_valid)

    action = res["action"]
    pred = res["prediction"]
    score = res["final_risk_score"]
    reasons_list = res["reasons"]

    if dry_run or getattr(request, 'dry_run', False):
        return action, pred, score, reasons_list

    # Enforce database actions
    if action == "ACCOUNT_LOCKED":
        existing_lock = db.query(models.AccountLock).filter(models.AccountLock.user_id == request.user_id).first()
        if not existing_lock:
            lock = models.AccountLock(user_id=request.user_id, reason="Exceeded maximum failed attempts.")
            db.add(lock)
        create_incident(db, None, "BRUTE_FORCE", "HIGH", f"User {request.user_id} exceeded maximum failed login attempts.", action, username=request.user_id, ip_address=request.ip_address)

    elif action in ["BLOCK_IP", "BLOCKED_AND_DENIED"]:
        existing_block = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == request.ip_address).first()
        if not existing_block:
            block = models.BlockedIP(ip_address=request.ip_address, reason="High frequency login attempts or malicious activity.")
            db.add(block)
        threat_type = "HIGH_FREQUENCY_IP" if pred == "BLOCKED_IP" else "MALICIOUS_IP"
        create_incident(db, None, threat_type, "CRITICAL", f"Automated block enforced for IP {request.ip_address}.", action, username=request.user_id, ip_address=request.ip_address)

    elif score >= 70 or pred == "ACCOUNT_TAKEOVER":
        create_incident(db, None, "ACCOUNT_TAKEOVER" if pred == "ACCOUNT_TAKEOVER" else "ANOMALOUS_ACCESS", "HIGH", f"High risk login detected for user {request.user_id} from {request.ip_address}.", action, username=request.user_id, ip_address=request.ip_address)

    return action, pred, score, reasons_list

def create_incident(db: Session, attempt_id, threat_type, severity, description, action, username=None, ip_address=None):
    existing = db.query(models.SecurityIncident).filter(
        models.SecurityIncident.threat_type == threat_type,
        models.SecurityIncident.username == username,
        models.SecurityIncident.ip_address == ip_address,
        models.SecurityIncident.status == "OPEN"
    ).first()
    
    if existing:
        # Just update the timestamp and maybe severity
        existing.updated_at = datetime.datetime.now(datetime.timezone.utc)
        existing.severity = severity
        db.commit()
        return

    incident = models.SecurityIncident(
        login_attempt_id=attempt_id,
        threat_type=threat_type,
        username=username,
        ip_address=ip_address,
        severity=severity,
        description=description,
        prevention_action=action,
        status="OPEN"
    )
    db.add(incident)
    
    # Also generate a security alert for the dashboard
    alert = models.Alert(
        type=severity,
        message=f"{threat_type}: {description}"
    )
    db.add(alert)
    db.commit()
