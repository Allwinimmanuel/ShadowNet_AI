"""
ueba.py — User and Entity Behavior Analytics
Computes behavioral baselines per user and detects anomalies by comparing
recent login events against each user's historical normal patterns.
"""
from sqlalchemy.orm import Session
from . import models
import datetime
import statistics
from collections import Counter


# ── Baseline computation ───────────────────────────────────────────────────

def _compute_baseline(records: list) -> dict:
    """Build a behavioral baseline dict from a list of LoginAttempt records."""
    if not records:
        return None

    hours = [r.login_hour for r in records if r.login_hour is not None]
    ips   = [r.ip_address for r in records if r.ip_address]
    devs  = [r.device_type for r in records if r.device_type]
    risks = [r.risk_score for r in records if r.risk_score is not None]

    common_ips    = [ip for ip, _ in Counter(ips).most_common(3)]
    common_devs   = [d for d, _ in Counter(devs).most_common(2)]
    common_hour_c = Counter(hours)
    peak_hours    = [h for h, _ in common_hour_c.most_common(5)]

    return {
        "sample_size":    len(records),
        "common_ips":     common_ips,
        "common_devices": common_devs,
        "peak_hours":     sorted(peak_hours),
        "avg_hour":       round(statistics.mean(hours), 1) if hours else 12,
        "avg_risk":       round(statistics.mean(risks), 1) if risks else 0,
        "typical_hour_range": _hour_range(hours),
        "success_rate":   round(sum(1 for r in records if r.successful_login) / len(records) * 100, 1),
    }


def _hour_range(hours: list):
    if not hours:
        return {"start": 8, "end": 18}
    mean = statistics.mean(hours)
    stdev = statistics.stdev(hours) if len(hours) > 1 else 2
    return {"start": max(0, round(mean - stdev)), "end": min(23, round(mean + stdev))}


# ── Anomaly scoring ────────────────────────────────────────────────────────

def _anomaly_score(record, baseline: dict) -> tuple[float, list]:
    """Return (score 0-100, explanation list) comparing a record against baseline."""
    if not baseline:
        return 0.0, []

    score = 0.0
    explanations = []

    # Login hour deviation
    hr = record.login_hour
    if hr is not None:
        hr_range = baseline["typical_hour_range"]
        if hr < hr_range["start"] or hr > hr_range["end"]:
            deviation = min(abs(hr - hr_range["start"]), abs(hr - hr_range["end"]))
            pts = min(30, deviation * 5)
            score += pts
            explanations.append(
                f"Login at {hr:02d}:xx — outside typical window ({hr_range['start']:02d}:00–{hr_range['end']:02d}:00)"
            )

    # Unknown IP
    if record.ip_address and baseline["common_ips"]:
        if record.ip_address not in baseline["common_ips"]:
            score += 25
            explanations.append(
                f"Login from unrecognised IP: {record.ip_address} "
                f"(known IPs: {', '.join(baseline['common_ips'][:2])})"
            )

    # Unknown device
    if record.device_type and baseline["common_devices"]:
        if record.device_type not in baseline["common_devices"]:
            score += 20
            explanations.append(
                f"Unrecognised device: {record.device_type} "
                f"(typical: {', '.join(baseline['common_devices'][:2])})"
            )

    # Failed login
    if not record.successful_login:
        score += 15
        explanations.append("Failed login attempt")

    # Risk score above baseline
    if record.risk_score and baseline["avg_risk"] > 0:
        excess = record.risk_score - baseline["avg_risk"]
        if excess > 20:
            pts = min(20, excess * 0.5)
            score += pts
            explanations.append(
                f"Risk score {record.risk_score:.0f}% — "
                f"{excess:.0f} points above user's average ({baseline['avg_risk']:.0f}%)"
            )

    return round(min(100, score), 1), explanations


# ── Public API ─────────────────────────────────────────────────────────────

def get_user_baseline(db: Session, user_id: str) -> dict:
    """Return a user's behavioral baseline computed from their 30-day history."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    records = (
        db.query(models.LoginAttempt)
        .filter(
            models.LoginAttempt.user_id == user_id,
            models.LoginAttempt.created_at >= cutoff
        )
        .order_by(models.LoginAttempt.created_at.asc())
        .all()
    )
    baseline = _compute_baseline(records)
    if not baseline:
        return {"user_id": user_id, "baseline": None, "message": "Insufficient history to build baseline."}

    return {"user_id": user_id, "baseline": baseline}


def get_all_anomalies(db: Session) -> list:
    """
    For every user with recent activity, compare their last 5 logins against
    their 30-day baseline and return anomaly reports.
    """
    cutoff_baseline = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    cutoff_recent   = datetime.datetime.utcnow() - datetime.timedelta(hours=24)

    # Get all users active in last 24h
    recent_attempts = (
        db.query(models.LoginAttempt)
        .filter(models.LoginAttempt.created_at >= cutoff_recent)
        .all()
    )
    user_ids = {a.user_id for a in recent_attempts if a.user_id}

    anomalies = []
    for uid in user_ids:
        # Build baseline from 30-day history
        history = (
            db.query(models.LoginAttempt)
            .filter(
                models.LoginAttempt.user_id == uid,
                models.LoginAttempt.created_at >= cutoff_baseline
            )
            .order_by(models.LoginAttempt.created_at.asc())
            .all()
        )
        baseline = _compute_baseline(history)
        if not baseline or baseline["sample_size"] < 3:
            continue

        # Score recent events
        recent = [a for a in recent_attempts if a.user_id == uid]
        top_score = 0.0
        top_explanations = []
        for rec in recent:
            sc, expl = _anomaly_score(rec, baseline)
            if sc > top_score:
                top_score = sc
                top_explanations = expl

        if top_score >= 20:  # only surface meaningful anomalies
            anomalies.append({
                "user_id": uid,
                "anomaly_score": top_score,
                "severity": _severity_label(top_score),
                "explanations": top_explanations,
                "recent_events": len(recent),
                "baseline_sample": baseline["sample_size"],
                "baseline_avg_risk": baseline["avg_risk"],
                "baseline_peak_hours": baseline["peak_hours"],
                "baseline_common_ips": baseline["common_ips"],
            })

    anomalies.sort(key=lambda x: -x["anomaly_score"])
    return anomalies


def get_user_ueba_report(db: Session, user_id: str) -> dict:
    """Full UEBA report: baseline + recent activity + anomaly analysis."""
    baseline_data = get_user_baseline(db, user_id)
    baseline = baseline_data.get("baseline")

    # Recent 7 days
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent_records = (
        db.query(models.LoginAttempt)
        .filter(
            models.LoginAttempt.user_id == user_id,
            models.LoginAttempt.created_at >= cutoff
        )
        .order_by(models.LoginAttempt.created_at.desc())
        .limit(20)
        .all()
    )

    events = []
    for rec in recent_records:
        score, explanations = _anomaly_score(rec, baseline) if baseline else (0, [])
        events.append({
            "id": rec.id,
            "timestamp": rec.created_at.isoformat() if rec.created_at else None,
            "login_hour": rec.login_hour,
            "ip_address": rec.ip_address,
            "device_type": rec.device_type,
            "action_taken": rec.action_taken,
            "prediction": rec.prediction,
            "risk_score": round(rec.risk_score or 0, 1),
            "successful": rec.successful_login,
            "anomaly_score": score,
            "anomaly_reasons": explanations,
        })

    max_anomaly = max((e["anomaly_score"] for e in events), default=0)

    return {
        "user_id": user_id,
        "baseline": baseline,
        "recent_events": events,
        "max_anomaly_score": max_anomaly,
        "anomaly_severity": _severity_label(max_anomaly),
        "summary": _build_summary(user_id, baseline, events),
    }


def _build_summary(user_id, baseline, events) -> str:
    if not baseline:
        return f"Insufficient history to evaluate {user_id}'s behavior."
    anomalous = [e for e in events if e["anomaly_score"] >= 30]
    if not anomalous:
        return f"{user_id}'s recent activity is consistent with their baseline behavior."
    return (
        f"{user_id} has {len(anomalous)} event(s) that deviate significantly "
        f"from their normal pattern. Review the flagged events below."
    )


def _severity_label(score: float) -> str:
    if score >= 75: return "CRITICAL"
    if score >= 50: return "HIGH"
    if score >= 25: return "MEDIUM"
    return "LOW"
