"""
risk_engine.py — Advanced Multi-Signal Risk Fusion & Explainable AI (XAI) Engine
Part of ShadowNet AI Real-Time Adaptive Login Defense.

Fuses:
  1. Machine Learning Inference (RandomForestClassifier predict_proba)
  2. Deterministic Rule Violations (Velocity, Lockouts, Blacklists)
  3. UEBA (User & Entity Behavior Analytics baselines)
  4. Threat Intelligence (IP Reputation, Tor/Proxy flags, Geo-Velocity)
  5. Contextual Signals (Time-of-Day, Device Novelty, Sensitivity)

Outputs a calibrated 0-100 Risk Score with mathematically transparent additive breakdowns.
"""

from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
import datetime
from . import models, ml_service, ueba

# Known high-risk IPs, Tor nodes, or malicious proxy ranges for local simulation / detection
KNOWN_MALICIOUS_IPS = {
    "185.220.101.45": "Known Tor Exit Node (relay-de-01)",
    "45.12.33.11": "Flagged Botnet C2 Proxy (RU/CN pool)",
    "198.51.100.23": "Credential Stuffing Proxy Farm",
    "103.251.167.20": "High-Velocity Scanner IP",
    "194.26.29.112": "Known Bulletproof Hoster"
}

# Geolocation distance heuristic (mock coordinates for demo locations to detect impossible travel)
GEO_COORDINATES = {
    "chennai, india": (13.0827, 80.2707),
    "new york, usa": (40.7128, -74.0060),
    "london, uk": (51.5074, -0.1278),
    "tokyo, japan": (35.6762, 139.6503),
    "sydney, australia": (-33.8688, 151.2093),
    "berlin, germany": (52.5200, 13.4050),
    "moscow, ru": (55.7558, 37.6173),
    "unknown": (0.0, 0.0)
}

def calculate_geo_distance(loc1: str, loc2: str) -> float:
    """Approximate distance in km between two location strings for impossible travel check."""
    c1 = GEO_COORDINATES.get(loc1.strip().lower(), (0.0, 0.0))
    c2 = GEO_COORDINATES.get(loc2.strip().lower(), (0.0, 0.0))
    if c1 == (0.0, 0.0) or c2 == (0.0, 0.0):
        return 5000.0 if loc1.lower() != loc2.lower() else 0.0
    import math
    # Haversine formula approximation
    lat1, lon1 = math.radians(c1[0]), math.radians(c1[1])
    lat2, lon2 = math.radians(c2[0]), math.radians(c2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return 6371.0 * c


class RiskFusionEngine:
    def __init__(self, db: Session):
        self.db = db

    def evaluate(self, request_data: Dict[str, Any], is_password_valid: bool = True) -> Dict[str, Any]:
        """
        Comprehensive evaluation returning:
          - final_risk_score (0-100)
          - prediction (NORMAL, SUSPICIOUS, BRUTE_FORCE, BLOCKED_IP, ACCOUNT_TAKEOVER)
          - action (ALLOWED, FLAG_SUSPICIOUS, CHALLENGE, DENIED, ACCOUNT_LOCKED, BLOCK_IP, BLOCKED_AND_DENIED)
          - confidence (float)
          - reasons (List[str])
          - breakdown (List[Dict] showing exact signal contributions)
          - ueba_deviation (Dict)
          - threat_intel (Dict)
        """
        user_id = request_data.get("user_id", "Unknown")
        ip_address = request_data.get("ip_address", "127.0.0.1")
        device_type = request_data.get("device_type", "Unknown")
        browser = request_data.get("browser", "Unknown")
        location = request_data.get("location", "Unknown")
        login_hour = request_data.get("login_hour", datetime.datetime.now().hour)
        failed_attempts = request_data.get("failed_attempts", 0)

        breakdown: List[Dict[str, Any]] = []
        rule_violations: List[str] = []
        reasons: List[str] = []

        # ---------------------------------------------------------
        # 1. HARD ENFORCEMENT CHECKS (Immediate Kill-Switches)
        # ---------------------------------------------------------
        locked_account = self.db.query(models.AccountLock).filter(models.AccountLock.user_id == user_id).first()
        if locked_account:
            return {
                "final_risk_score": 100.0,
                "prediction": "BRUTE_FORCE",
                "action": "ACCOUNT_LOCKED",
                "confidence": 1.0,
                "reasons": ["Account is locked because of repeated failed login attempts."],
                "breakdown": [{
                    "category": "HARD_POLICY",
                    "signal": "Account Lock Active",
                    "points": 100,
                    "evidence": f"Locked on {locked_account.locked_at}. Reason: {locked_account.reason}"
                }],
                "attack_category": "Account Lockout Enforcement"
            }

        blocked_ip = self.db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == ip_address).first()
        if blocked_ip:
            return {
                "final_risk_score": 100.0,
                "prediction": "BLOCKED_IP",
                "action": "BLOCKED_AND_DENIED",
                "confidence": 1.0,
                "reasons": ["Login denied because the IP address is blocked."],
                "breakdown": [{
                    "category": "HARD_POLICY",
                    "signal": "IP Blacklist Active",
                    "points": 100,
                    "evidence": f"Blocked on {blocked_ip.blocked_at}. Reason: {blocked_ip.reason}"
                }],
                "attack_category": "Blacklisted Infrastructure"
            }

        # ---------------------------------------------------------
        # 2. LOGIN VELOCITY & BRUTE FORCE DETECTION
        # ---------------------------------------------------------
        # Query attempts within last 60 seconds from this IP
        one_min_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=60)
        recent_ip_count = self.db.query(models.LoginAttempt).filter(
            models.LoginAttempt.ip_address == ip_address,
            models.LoginAttempt.created_at >= one_min_ago
        ).count()

        # Query recent attempts across different usernames from this IP (Credential Stuffing check)
        distinct_users_from_ip = self.db.query(models.LoginAttempt.user_id).filter(
            models.LoginAttempt.ip_address == ip_address,
            models.LoginAttempt.created_at >= one_min_ago
        ).distinct().count()

        # Rule triggers for failed attempts
        if failed_attempts >= 5:
            rule_violations.append("Exceeded maximum failed attempts (>= 5)")
            breakdown.append({
                "category": "AUTHENTICATION",
                "signal": "High consecutive failed attempts",
                "points": 50,
                "evidence": f"{failed_attempts} consecutive failures recorded"
            })
            reasons.append("Exceeded maximum failed attempts (5). Account locked.")
        elif failed_attempts == 4:
            rule_violations.append("Multiple failed attempts (4 attempts)")
            breakdown.append({
                "category": "AUTHENTICATION",
                "signal": "Elevated failed attempts threshold",
                "points": 45,
                "evidence": "4 consecutive failed login attempts"
            })
            reasons.append("Multiple consecutive failed login attempts (4).")
        elif failed_attempts in [1, 2, 3]:
            breakdown.append({
                "category": "AUTHENTICATION",
                "signal": "Failed attempt sequence",
                "points": 5 * failed_attempts,
                "evidence": f"{failed_attempts} failed attempt(s)"
            })

        if not is_password_valid:
            breakdown.append({
                "category": "CREDENTIALS",
                "signal": "Invalid password supplied",
                "points": 15,
                "evidence": "Supplied credential hash mismatch"
            })
            reasons.append("Invalid credentials provided")

        if recent_ip_count >= 10:
            rule_violations.append("Severe high-frequency probing (>= 10 attempts/min)")
            breakdown.append({
                "category": "VELOCITY",
                "signal": "Extreme login velocity",
                "points": 35,
                "evidence": f"{recent_ip_count} requests in 60s from {ip_address}"
            })
            reasons.append("Extreme request velocity detected")
        elif recent_ip_count >= 4:
            breakdown.append({
                "category": "VELOCITY",
                "signal": "Elevated login rate",
                "points": 15,
                "evidence": f"{recent_ip_count} requests in last 60s"
            })
            reasons.append("Unusual login frequency")

        if distinct_users_from_ip >= 3:
            rule_violations.append("Credential stuffing pattern (multiple target accounts from single IP)")
            breakdown.append({
                "category": "AUTOMATION",
                "signal": "Credential stuffing cluster",
                "points": 30,
                "evidence": f"{distinct_users_from_ip} distinct user IDs probed from {ip_address}"
            })
            reasons.append("Credential stuffing signature: multiple targets from single IP")

        # ---------------------------------------------------------
        # 3. THREAT INTELLIGENCE & REPUTATION
        # ---------------------------------------------------------
        if ip_address in KNOWN_MALICIOUS_IPS:
            intel_label = KNOWN_MALICIOUS_IPS[ip_address]
            breakdown.append({
                "category": "THREAT_INTEL",
                "signal": "Flagged Threat Infrastructure",
                "points": 30,
                "evidence": f"{ip_address}: {intel_label}"
            })
            reasons.append(f"Threat Intel match: {intel_label}")

        # ---------------------------------------------------------
        # 4. UEBA & BEHAVIORAL BASELINE
        # ---------------------------------------------------------
        user_history = self.db.query(models.LoginAttempt).filter(
            models.LoginAttempt.user_id == user_id,
            models.LoginAttempt.successful_login == True
        ).order_by(models.LoginAttempt.created_at.desc()).limit(50).all()

        last_successful = user_history[0] if user_history else None

        if user_history:
            known_ips = set(a.ip_address for a in user_history if a.ip_address)
            known_devices = set(a.device_type for a in user_history if a.device_type)
            known_locations = set(a.location for a in user_history if a.location)
            known_hours = [a.login_hour for a in user_history if a.login_hour is not None]

            # IP Novelty
            if ip_address not in known_ips and request_data.get("is_new_ip", 1) == 1:
                breakdown.append({
                    "category": "UEBA_IP",
                    "signal": "New IP Address for User",
                    "points": 15,
                    "evidence": f"IP {ip_address} has not been used in past {len(user_history)} logins"
                })
                reasons.append("New IP address detected")

            # Device Novelty
            if device_type not in known_devices and request_data.get("is_new_device", 1) == 1:
                breakdown.append({
                    "category": "UEBA_DEVICE",
                    "signal": "Unfamiliar Device Fingerprint",
                    "points": 20,
                    "evidence": f"Device '{device_type}' not in user verified baseline"
                })
                reasons.append("Unrecognized device fingerprint")

            # Location Novelty / Impossible Travel
            if location not in known_locations and request_data.get("location_changed", 0) == 1:
                if last_successful and last_successful.location:
                    km_distance = calculate_geo_distance(last_successful.location, location)
                    time_diff_hours = (datetime.datetime.now(datetime.timezone.utc) - 
                                      (last_successful.created_at.replace(tzinfo=datetime.timezone.utc) 
                                       if last_successful.created_at.tzinfo is None else last_successful.created_at)).total_seconds() / 3600.0

                    if km_distance > 1000 and time_diff_hours < 2.0:
                        breakdown.append({
                            "category": "IMPOSSIBLE_TRAVEL",
                            "signal": "Impossible Travel Anomaly",
                            "points": 35,
                            "evidence": f"{int(km_distance)} km jump from {last_successful.location} to {location} in {round(time_diff_hours, 1)}h"
                        })
                        reasons.append("Impossible travel velocity: physical location changed too rapidly")
                    else:
                        breakdown.append({
                            "category": "UEBA_GEO",
                            "signal": "Unfamiliar Geographic Location",
                            "points": 18,
                            "evidence": f"Location {location} differs from user's regular locations"
                        })
                        reasons.append("Unusual location change")
                else:
                    breakdown.append({
                        "category": "UEBA_GEO",
                        "signal": "New Geographic Region",
                        "points": 15,
                        "evidence": f"User connecting from new region: {location}"
                    })
                    reasons.append("New location detected")

            # Off-Hours Deviation
            if known_hours:
                avg_hour = sum(known_hours) / len(known_hours)
                hour_diff = abs(login_hour - avg_hour)
                if (login_hour < 5 or login_hour > 23) and hour_diff > 4:
                    breakdown.append({
                        "category": "UEBA_TIME",
                        "signal": "Abnormal Access Hours",
                        "points": 12,
                        "evidence": f"Login at hour {login_hour}:00 (User baseline center is {round(avg_hour)}:00)"
                    })
                    reasons.append("Abnormal off-hours access")
        else:
            # First time user or no history
            if login_hour < 5 or login_hour > 23:
                breakdown.append({
                    "category": "TIME",
                    "signal": "Unusual late night / early morning hour",
                    "points": 10,
                    "evidence": f"Login attempt at {login_hour}:00"
                })
                reasons.append("Unusual login hour")

        # ---------------------------------------------------------
        # 5. MACHINE LEARNING MODEL PREDICTION
        # ---------------------------------------------------------
        ml_prediction = "NORMAL"
        ml_confidence = 0.85
        ml_risk_val = 0.0

        try:
            ml_res = ml_service.analyze_login(request_data)
            ml_prediction = ml_res.get("prediction", "NORMAL")
            ml_confidence = ml_res.get("confidence", 0.85)
            ml_risk_val = ml_res.get("risk_score", 0.0)

            if ml_prediction == "SUSPICIOUS" or ml_risk_val > 50:
                breakdown.append({
                    "category": "MACHINE_LEARNING",
                    "signal": "Random Forest ML Risk Anomaly",
                    "points": round(ml_risk_val * 0.25),
                    "evidence": f"Classifier predicted {ml_prediction} (Confidence: {int(ml_confidence*100)}%)"
                })
        except Exception as e:
            pass

        # ---------------------------------------------------------
        # 6. RISK FUSION: SUMMATION & THRESHOLD CALIBRATION
        # ---------------------------------------------------------
        raw_score = sum(item["points"] for item in breakdown)
        final_score = min(100.0, max(0.0, float(raw_score)))

        # Prioritize hard limits
        if failed_attempts >= 5:
            final_score = max(final_score, 95.0)
            prediction = "BRUTE_FORCE"
            action = "ACCOUNT_LOCKED"
        elif failed_attempts == 4:
            final_score = max(final_score, 68.0)
            prediction = "SUSPICIOUS"
            action = "FLAG_SUSPICIOUS"
        elif recent_ip_count >= 10:
            final_score = max(final_score, 90.0)
            prediction = "BLOCKED_IP"
            action = "BLOCK_IP"
        elif any(item["category"] == "IMPOSSIBLE_TRAVEL" for item in breakdown):
            final_score = max(final_score, 82.0)
            prediction = "ACCOUNT_TAKEOVER"
            action = "FLAG_SUSPICIOUS" if is_password_valid else "DENIED"
        elif distinct_users_from_ip >= 3:
            final_score = max(final_score, 85.0)
            prediction = "SUSPICIOUS"
            action = "BLOCK_IP"
        elif final_score >= 60:
            prediction = "SUSPICIOUS"
            action = "FLAG_SUSPICIOUS" if is_password_valid else "DENIED"
        elif final_score >= 45:
            prediction = "SUSPICIOUS"
            action = "FLAG_SUSPICIOUS" if is_password_valid else "DENIED"
        else:
            prediction = "NORMAL"
            action = "ALLOWED" if is_password_valid else "DENIED"

        # Unique reasons
        unique_reasons = []
        for r in reasons:
            if r not in unique_reasons:
                unique_reasons.append(r)
        if not unique_reasons:
            if action == "ALLOWED":
                unique_reasons = ["Normal trusted login pattern"]
            else:
                unique_reasons = ["Routine security verification"]

        # Attack categorization
        attack_category = "Normal Activity"
        if prediction == "BRUTE_FORCE":
            attack_category = "Brute Force Attack"
        elif "Credential stuffing" in " ".join(unique_reasons):
            attack_category = "Credential Stuffing Attack"
        elif prediction == "ACCOUNT_TAKEOVER" or any(item["category"] == "IMPOSSIBLE_TRAVEL" for item in breakdown):
            attack_category = "Account Takeover / Impossible Travel"
        elif prediction == "BLOCKED_IP":
            attack_category = "High-Velocity Denial/Probing"
        elif final_score >= 40:
            attack_category = "Anomalous Access Pattern"

        return {
            "final_risk_score": round(final_score, 1),
            "prediction": prediction,
            "action": action,
            "confidence": round(ml_confidence, 2),
            "reasons": unique_reasons,
            "breakdown": breakdown,
            "rule_violations": rule_violations,
            "attack_category": attack_category
        }
