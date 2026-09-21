from sqlalchemy.orm import Session
from . import models, schemas
import datetime
import json

def evaluate_and_prevent(db: Session, request: schemas.LoginRequest, prediction: str, risk_score: float, reasons: list):
    
    # Calculate Deterministic Risk Score
    calc_score = 0
    calc_reasons = []

    # Check database history for IP, Device, Browser
    user_history = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.user_id == request.user_id,
        models.LoginAttempt.successful_login == True
    ).all()
    
    known_ips = set(a.ip_address for a in user_history) if user_history else set()
    known_devices = set(a.device_type for a in user_history) if user_history else set()
    known_browsers = set(a.browser for a in user_history) if user_history else set()

    is_new_ip = len(known_ips) > 0 and request.ip_address not in known_ips
    is_new_device = len(known_devices) > 0 and request.device_type not in known_devices
    is_new_browser = len(known_browsers) > 0 and request.browser not in known_browsers
    
    if not user_history:
        # First login ever, treat as normal for these vectors
        pass
    else:
        if is_new_ip:
            calc_score += 25
            calc_reasons.append("New IP address")
        if is_new_device:
            calc_score += 20
            calc_reasons.append("New device")
        if is_new_browser:
            calc_score += 10
            calc_reasons.append("New browser")

    # Unusual login hour (12 AM - 5 AM)
    if 0 <= request.login_hour <= 5:
        calc_score += 15
        calc_reasons.append("Unusual login hour")

    # Three or more failed attempts
    if request.failed_attempts >= 3:
        calc_score += 25
        calc_reasons.append("Multiple failed attempts")

    # 10 or more attempts in 60 seconds (High Frequency)
    one_min_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=1)
    recent_ip_attempts = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.ip_address == request.ip_address,
        models.LoginAttempt.created_at >= one_min_ago
    ).count()

    if recent_ip_attempts >= 5:
        calc_score += 20
        calc_reasons.append("High frequency login attempts")

    calc_score = max(risk_score, calc_score)
    calc_score = min(100.0, float(calc_score))

    # --- HARD PREVENTION RULES ---

    # 1. Existing Account Lock
    locked_account = db.query(models.AccountLock).filter(models.AccountLock.user_id == request.user_id).first()
    if locked_account:
        return "ACCOUNT_LOCKED", "BRUTE_FORCE", 100.0, ["Account is locked because of repeated failed login attempts."]

    # 2. Existing IP Block
    blocked_ip = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == request.ip_address).first()
    if blocked_ip:
        return "BLOCKED_AND_DENIED", "BLOCKED_IP", 100.0, ["Login denied because the IP address is blocked."]

    # 3. Rule 1: 5 failed attempts
    if request.failed_attempts >= 5:
        action = "ACCOUNT_LOCKED"
        prediction = "BRUTE_FORCE"
        calc_score = max(calc_score, 95.0)
        
        lock = models.AccountLock(user_id=request.user_id, reason="Exceeded maximum failed attempts.")
        db.add(lock)
        create_incident(db, None, "BRUTE_FORCE", "HIGH", f"User {request.user_id} exceeded maximum failed login attempts.", action, username=request.user_id, ip_address=request.ip_address)
        return action, prediction, calc_score, calc_reasons

    # 4. Rule 2: 10 attempts in 60s
    if recent_ip_attempts >= 10:
        action = "BLOCK_IP"
        prediction = "BLOCKED_IP"
        calc_score = max(calc_score, 90.0)
        
        block = models.BlockedIP(ip_address=request.ip_address, reason="High frequency login attempts.")
        db.add(block)
        create_incident(db, None, "HIGH_FREQUENCY_IP", "CRITICAL", f"High frequency attempts from IP {request.ip_address}.", action, username=request.user_id, ip_address=request.ip_address)
        return action, prediction, calc_score, calc_reasons

    # 5. Rule 3: Suspicious Activity
    if calc_score >= 40:
        action = "FLAG_SUSPICIOUS"
        prediction = "SUSPICIOUS"
        return action, prediction, calc_score, calc_reasons

    # 6. Normal
    action = "ALLOWED"
    prediction = "NORMAL"
    return action, prediction, calc_score, calc_reasons

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
