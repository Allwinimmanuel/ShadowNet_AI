from sqlalchemy.orm import Session
from . import models, schemas
import datetime

MAX_FAILED_ATTEMPTS = 5
RISK_THRESHOLD = 0.70

def evaluate_and_prevent(db: Session, request: schemas.LoginRequest, prediction: str, risk_score: float, reasons: list):
    
    # 1. High frequency check: 10 or more attempts in 1 min
    one_min_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=1)
    recent_ip_attempts = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.ip_address == request.ip_address,
        models.LoginAttempt.created_at >= one_min_ago
    ).count()

    # Rule 4: HIGH FREQUENCY IP BLOCK
    if recent_ip_attempts >= 10:
        action = "BLOCK_IP"
        prediction = "HIGH_FREQUENCY_IP"
        # Check if already blocked to avoid duplicate entries
        if not db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == request.ip_address).first():
            block = models.BlockedIP(ip_address=request.ip_address, reason="High frequency login attempts.")
            db.add(block)
            db.commit()
        create_incident(db, None, "High Frequency Attack", "CRITICAL", f"High frequency attempts from IP {request.ip_address}.", action, username=request.user_id, ip_address=request.ip_address)
        return action, prediction, risk_score
    
    # Check if IP is already blocked
    blocked_ip = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == request.ip_address).first()
    if blocked_ip:
        action = "BLOCK_IP"
        prediction = "HIGH_FREQUENCY_IP"
        return action, prediction, risk_score
        
    # Rule 3: BRUTE FORCE / BLOCKED LOGIN
    if request.failed_attempts >= MAX_FAILED_ATTEMPTS:
        action = "LOCK_ACCOUNT"
        prediction = "BRUTE_FORCE"
        # Only add to lock table if not already locked
        if not db.query(models.AccountLock).filter(models.AccountLock.user_id == request.user_id).first():
            lock = models.AccountLock(user_id=request.user_id, reason="Exceeded maximum failed attempts.")
            db.add(lock)
            db.commit()
            create_incident(db, None, "Brute Force Attack", "HIGH", f"User {request.user_id} exceeded maximum failed login attempts.", action, username=request.user_id, ip_address=request.ip_address)
        return action, prediction, risk_score

    # Check if Account is already locked
    locked_account = db.query(models.AccountLock).filter(models.AccountLock.user_id == request.user_id).first()
    if locked_account:
        action = "LOCK_ACCOUNT"
        prediction = "BRUTE_FORCE"
        return action, prediction, risk_score

    # Rule 2: SUSPICIOUS ACTIVITY
    is_unusual_hour = request.login_hour < 5 or request.login_hour > 22
    has_suspicious_indicator = request.is_new_ip == 1 or request.is_new_device == 1 or is_unusual_hour
    
    if (1 <= request.failed_attempts <= 4) and has_suspicious_indicator:
        action = "FLAG_SUSPICIOUS"
        prediction = "SUSPICIOUS"
        return action, prediction, risk_score
        
    # Rule 1: NORMAL LOGIN
    # If ML prediction was suspicious but hard deterministic rules weren't met, override it.
    action = "ALLOW_LOGIN"
    prediction = "NORMAL"
        
    return action, prediction, risk_score

def create_incident(db: Session, attempt_id, threat_type, severity, description, action, username=None, ip_address=None):
    existing = db.query(models.SecurityIncident).filter(
        models.SecurityIncident.threat_type == threat_type,
        models.SecurityIncident.username == username,
        models.SecurityIncident.ip_address == ip_address,
        models.SecurityIncident.status == "OPEN"
    ).first()
    
    if existing:
        return

    incident = models.SecurityIncident(
        login_attempt_id=attempt_id,
        threat_type=threat_type,
        username=username,
        ip_address=ip_address,
        severity=severity,
        description=description,
        prevention_action=action
    )
    db.add(incident)
    db.commit()
    
    alert = models.Alert(type=threat_type, message=description)
    db.add(alert)
    db.commit()
