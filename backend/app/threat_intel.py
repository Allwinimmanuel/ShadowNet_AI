"""
threat_intel.py — AI Attack Prediction Engine + Dynamic Risk Scoring
Extends the existing ml_service with sequence-based threat analysis.
"""
from sqlalchemy.orm import Session
from . import models
import datetime
import statistics
from collections import defaultdict


# ── Constants ──────────────────────────────────────────────────────────────
ATTACK_CATEGORIES = {
    "brute_force":      {"label": "Brute Force Attack",        "min_risk": 60,  "indicators": ["failed_attempts"]},
    "account_takeover": {"label": "Potential Account Takeover","min_risk": 55,  "indicators": ["new_device", "new_ip", "off_hours"]},
    "credential_stuff": {"label": "Credential Stuffing",       "min_risk": 65,  "indicators": ["multi_user", "failed_attempts", "high_freq"]},
    "insider_threat":   {"label": "Insider Threat Activity",   "min_risk": 50,  "indicators": ["off_hours", "sensitive_access"]},
    "anomalous_access": {"label": "Anomalous Access Pattern",  "min_risk": 40,  "indicators": ["new_ip", "off_hours"]},
}

SEVERITY_MAP = [
    (80, "CRITICAL"),
    (60, "HIGH"),
    (40, "MEDIUM"),
    (20, "LOW"),
    (0,  "INFO"),
]

DEFENSIVE_ACTIONS = {
    "brute_force":      "Enforce account lockout. Consider adding CAPTCHA or IP rate-limiting.",
    "account_takeover": "Require MFA. Investigate session and device. Notify account owner.",
    "credential_stuff": "Block originating IPs. Force password resets for affected accounts.",
    "insider_threat":   "Audit user activity. Temporarily restrict sensitive-resource access.",
    "anomalous_access": "Verify user identity. Review access logs. Consider session termination.",
    "default":          "Monitor closely. Review related incidents and apply principle of least privilege.",
}


def _severity(risk: float) -> str:
    for threshold, label in SEVERITY_MAP:
        if risk >= threshold:
            return label
    return "INFO"


def get_threat_prediction(db: Session) -> dict:
    """
    Analyse the last 100 login attempts across all users/IPs and produce
    a structured threat prediction with explanation.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    attempts = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.created_at >= cutoff)
        .order_by(models.LoginAttempt.created_at.desc())
        .limit(100)
        .all()
    )

    if not attempts:
        return _no_threat_response()

    # ── Feature extraction ─────────────────────────────────────────────
    total            = len(attempts)
    failed           = sum(1 for a in attempts if not a.successful_login)
    blocked          = sum(1 for a in attempts if a.action_taken in ("BLOCK_IP", "LOCK_ACCOUNT", "BLOCK_AND_VERIFY"))
    suspicious_count = sum(1 for a in attempts if a.prediction == "SUSPICIOUS")
    unique_users     = len({a.user_id for a in attempts if a.user_id})
    unique_ips       = len({a.ip_address for a in attempts if a.ip_address})
    off_hours        = sum(1 for a in attempts if a.login_hour is not None and (a.login_hour < 6 or a.login_hour > 22))
    avg_risk         = statistics.mean(a.risk_score for a in attempts if a.risk_score is not None) if attempts else 0
    max_risk         = max((a.risk_score or 0) for a in attempts)
    high_risk_count  = sum(1 for a in attempts if (a.risk_score or 0) >= 70)

    # ── Indicator flags ────────────────────────────────────────────────
    indicators = []
    signal_scores = []

    if failed > 5:
        indicators.append(f"{failed} failed login attempts in the last 24 hours")
        signal_scores.append(min(40, failed * 4))
    if failed > 0 and suspicious_count > 0:
        # Successful login after failures
        successes = [a for a in attempts if a.successful_login]
        if successes:
            indicators.append("Successful login detected after repeated failures")
            signal_scores.append(25)
    if blocked > 0:
        indicators.append(f"{blocked} attempts actively blocked by prevention engine")
        signal_scores.append(blocked * 10)
    if off_hours > 3:
        indicators.append(f"{off_hours} login attempts outside business hours (before 06:00 or after 22:00)")
        signal_scores.append(15)
    if high_risk_count > 2:
        indicators.append(f"{high_risk_count} events with risk score ≥ 70%")
        signal_scores.append(min(30, high_risk_count * 5))
    if unique_ips > 5 and unique_users <= 3:
        indicators.append(f"Unusually high number of source IPs ({unique_ips}) for {unique_users} user(s)")
        signal_scores.append(20)
    if avg_risk > 50:
        indicators.append(f"Elevated average risk score across recent events: {avg_risk:.1f}%")
        signal_scores.append(15)

    # ── Compute composite risk ─────────────────────────────────────────
    composite_risk = min(100.0, max(avg_risk, sum(signal_scores) * 0.7))
    confidence = min(0.97, 0.55 + (len(indicators) * 0.08) + (total / 200))

    # ── Categorise attack ──────────────────────────────────────────────
    category, category_label = _categorize(failed, blocked, off_hours, unique_ips, unique_users, high_risk_count)
    severity = _severity(composite_risk)
    recommended_action = DEFENSIVE_ACTIONS.get(category, DEFENSIVE_ACTIONS["default"])

    return {
        "threat_type":        category_label,
        "risk_score":         round(composite_risk, 1),
        "confidence":         round(confidence * 100, 1),
        "severity":           severity,
        "category":           category,
        "indicators":         indicators,
        "recommended_action": recommended_action,
        "event_window":       "Last 24 hours",
        "events_analyzed":    total,
        "high_risk_events":   high_risk_count,
        "max_risk_seen":      round(max_risk, 1),
        "avg_risk":           round(avg_risk, 1),
    }


def _categorize(failed, blocked, off_hours, unique_ips, unique_users, high_risk_count):
    if failed >= 10 or blocked >= 5:
        return "brute_force", ATTACK_CATEGORIES["brute_force"]["label"]
    if unique_ips > 8 and unique_users <= 3:
        return "credential_stuff", ATTACK_CATEGORIES["credential_stuff"]["label"]
    if off_hours >= 3 and high_risk_count >= 2:
        return "insider_threat", ATTACK_CATEGORIES["insider_threat"]["label"]
    if failed >= 3 and high_risk_count >= 2:
        return "account_takeover", ATTACK_CATEGORIES["account_takeover"]["label"]
    if high_risk_count >= 1 or failed >= 2:
        return "anomalous_access", ATTACK_CATEGORIES["anomalous_access"]["label"]
    return "anomalous_access", "No Active Threat Detected"


def _no_threat_response():
    return {
        "threat_type":        "No Active Threat Detected",
        "risk_score":         5.0,
        "confidence":         95.0,
        "severity":           "INFO",
        "category":           "none",
        "indicators":         ["No login events recorded in the last 24 hours"],
        "recommended_action": "Continue routine monitoring.",
        "event_window":       "Last 24 hours",
        "events_analyzed":    0,
        "high_risk_events":   0,
        "max_risk_seen":      0.0,
        "avg_risk":           0.0,
    }


# ── Entity Risk Scores ─────────────────────────────────────────────────────

def get_entity_risk_scores(db: Session) -> dict:
    """Compute risk scores per user, per IP from last 7 days of login history."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    attempts = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.created_at >= cutoff)
        .all()
    )

    user_data: dict  = defaultdict(list)
    ip_data: dict    = defaultdict(list)
    device_data: dict= defaultdict(list)

    for a in attempts:
        risk = a.risk_score or 0
        if a.user_id:
            user_data[a.user_id].append(a)
        if a.ip_address:
            ip_data[a.ip_address].append(a)
        if a.device_type:
            device_data[a.device_type].append(a)

    def score_entity(records):
        if not records:
            return 0.0
        risks = [r.risk_score or 0 for r in records]
        failed = sum(1 for r in records if not r.successful_login)
        blocked = sum(1 for r in records if r.action_taken in ("BLOCK_IP","LOCK_ACCOUNT","BLOCK_AND_VERIFY"))
        base = statistics.mean(risks) if risks else 0
        penalty = min(40, failed * 3 + blocked * 10)
        return round(min(100, base + penalty), 1)

    users = [
        {
            "id": uid,
            "type": "USER",
            "risk_score": score_entity(recs),
            "severity": _severity(score_entity(recs)),
            "total_attempts": len(recs),
            "failed": sum(1 for r in recs if not r.successful_login),
            "blocked": sum(1 for r in recs if r.action_taken in ("BLOCK_IP","LOCK_ACCOUNT","BLOCK_AND_VERIFY")),
        }
        for uid, recs in sorted(user_data.items(), key=lambda x: -score_entity(x[1]))
    ]

    ips = [
        {
            "id": ip,
            "type": "IP",
            "risk_score": score_entity(recs),
            "severity": _severity(score_entity(recs)),
            "total_attempts": len(recs),
            "failed": sum(1 for r in recs if not r.successful_login),
            "blocked": sum(1 for r in recs if r.action_taken in ("BLOCK_IP","LOCK_ACCOUNT","BLOCK_AND_VERIFY")),
        }
        for ip, recs in sorted(ip_data.items(), key=lambda x: -score_entity(x[1]))
    ]

    return {"users": users, "ips": ips}


# ── Attack Path Graph ──────────────────────────────────────────────────────

def get_attack_paths(db: Session) -> dict:
    """
    Build an attack-path graph from correlated security incidents and login attempts.
    Returns nodes and edges suitable for SVG graph rendering.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=48)
    incidents = (
        db.query(models.SecurityIncident)
        .filter(models.SecurityIncident.created_at >= cutoff)
        .order_by(models.SecurityIncident.created_at.desc())
        .limit(20)
        .all()
    )
    attempts = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.created_at >= cutoff)
        .order_by(models.LoginAttempt.created_at.desc())
        .limit(30)
        .all()
    )

    nodes = []
    edges = []
    node_ids = set()

    def add_node(nid, label, ntype, risk, status="active"):
        if nid not in node_ids:
            node_ids.add(nid)
            nodes.append({"id": nid, "label": label, "type": ntype, "risk": risk, "status": status})

    def add_edge(src, dst, label, risk_level="medium"):
        edges.append({"source": src, "target": dst, "label": label, "risk_level": risk_level})

    # Always include core architecture nodes
    add_node("internet", "Internet", "source", 10, "neutral")
    add_node("firewall", "Firewall", "infrastructure", 5, "active")
    add_node("auth_server", "Auth Server", "server", 20, "active")
    add_node("app_server", "App Server", "server", 15, "active")
    add_node("database", "Database", "database", 30, "active")
    add_edge("internet", "firewall", "traffic", "low")
    add_edge("firewall", "auth_server", "filtered", "low")
    add_edge("auth_server", "app_server", "authenticated", "low")
    add_edge("app_server", "database", "queries", "low")

    # Add user/IP nodes from recent attempts
    suspicious_attempts = [a for a in attempts if a.prediction == "SUSPICIOUS" or not a.successful_login]
    for a in suspicious_attempts[:10]:
        uid = f"user_{a.user_id}" if a.user_id else None
        ipid = f"ip_{a.ip_address}" if a.ip_address else None
        risk = round(a.risk_score or 0)
        action = a.action_taken or "UNKNOWN"

        if ipid:
            add_node(ipid, a.ip_address or "Unknown IP", "ip", risk,
                     "blocked" if action in ("BLOCK_IP","BLOCK_AND_VERIFY") else "suspicious")
            add_edge("internet", ipid, "origin", "high" if risk > 70 else "medium")
            add_edge(ipid, "firewall", "probe", "high" if risk > 70 else "medium")

        if uid:
            add_node(uid, a.user_id or "Unknown User", "user", risk,
                     "locked" if action == "LOCK_ACCOUNT" else ("suspicious" if risk > 50 else "active"))
            if ipid:
                add_edge(ipid, uid, "login attempt", "high" if risk > 70 else "medium")
            if action == "ALLOW_LOGIN":
                add_edge(uid, "auth_server", "authenticated", "low")
                add_edge(uid, "app_server", "access", "medium")

    # Map incidents to graph events
    chains = []
    for inc in incidents[:8]:
        chains.append({
            "id": inc.id,
            "threat_type": inc.threat_type,
            "severity": inc.severity,
            "description": inc.description,
            "action": inc.prevention_action,
            "timestamp": inc.created_at.isoformat() if inc.created_at else None,
        })

    return {"nodes": nodes, "edges": edges, "attack_chains": chains}
