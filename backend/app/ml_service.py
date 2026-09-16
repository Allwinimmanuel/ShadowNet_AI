import os
import joblib
import pandas as pd
import json

# Load ML components
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "..", "models", "login_attack_model.joblib")
metadata_path = os.path.join(base_dir, "..", "models", "model_metadata.json")

model = None
metadata = None

def load_model():
    global model, metadata
    if os.path.exists(model_path):
        model = joblib.load(model_path)
    else:
        raise FileNotFoundError(f"Model file not found at {model_path}.")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

def analyze_login(request_data: dict):
    if model is None:
        try:
            load_model()
        except FileNotFoundError as e:
            print(f"Prediction error: {e}. Falling back to heuristic rules.")
        
    # Determine Reasons
    reasons = []
    risk_base = 0.0
    
    if request_data.get("failed_attempts", 0) > 0:
        reasons.append("Recent failed attempts")
        risk_base += 10 * request_data.get("failed_attempts", 0)
    if request_data.get("is_new_ip", 0) == 1:
        reasons.append("New IP address detected")
        risk_base += 15
    if request_data.get("is_new_device", 0) == 1:
        reasons.append("Unrecognized device")
        risk_base += 15
    if request_data.get("location_changed", 0) == 1:
        reasons.append("Unusual location change")
        risk_base += 15
    if request_data.get("login_hour", 12) < 5 or request_data.get("login_hour", 12) > 23:
        reasons.append("Unusual login hour")
        risk_base += 10
    if request_data.get("login_frequency", 1) > 10:
        reasons.append("Unusual login frequency")
        risk_base += 40
        
    # Format for model
    df = pd.DataFrame([request_data])
    
    try:
        if model is not None:
            proba = model.predict_proba(df)[0]
            suspicious_prob = float(proba[1])
            prediction_label = "SUSPICIOUS" if suspicious_prob >= 0.5 else "NORMAL"
            confidence = float(max(proba))
            risk_score = suspicious_prob * 100.0
        else:
            # Fallback heuristic if model not loaded
            risk_score = risk_base
            prediction_label = "SUSPICIOUS" if risk_score > 50 else "NORMAL"
            confidence = 0.8
            
    except Exception as e:
        print(f"Prediction error: {e}")
        risk_score = risk_base
        prediction_label = "SUSPICIOUS" if risk_score > 50 else "NORMAL"
        confidence = 0.8

    # Ensure risk score reflects heuristics if model fails to catch something obvious
    if risk_base > 60 and prediction_label == "NORMAL":
        prediction_label = "SUSPICIOUS"
        risk_score = max(risk_score, risk_base)
        confidence = 0.85

    # Clamp the final score
    risk_score = max(0, min(100, risk_score))

    # Add a small base risk for normal logins if it's strictly 0
    if risk_score == 0 and prediction_label == "NORMAL":
        risk_score = 5.0

    return {
        "prediction": prediction_label,
        "risk_score": round(risk_score, 1),
        "confidence": round(confidence, 2),
        "reasons": reasons
    }


# ── Explainable AI ────────────────────────────────────────────────────────

FEATURE_LABELS = {
    "login_hour":                  "Login time of day",
    "day_of_week":                 "Day of week",
    "failed_attempts":             "Number of recent failed attempts",
    "login_frequency":             "Login frequency",
    "time_since_last_login":       "Time since last login",
    "is_new_ip":                   "Login from unrecognised IP",
    "is_new_device":               "Login from unrecognised device",
    "location_changed":            "Location change detected",
    "account_age_days":            "Account age",
    "previous_successful_logins":  "History of successful logins",
}

ATTACK_CATEGORY_MAP = [
    (["failed_attempts", "login_frequency"],      "Brute Force / Credential Attack"),
    (["is_new_ip", "is_new_device", "login_hour"],"Potential Account Takeover"),
    (["location_changed", "is_new_ip"],           "Geographic Anomaly"),
    (["login_hour", "day_of_week"],               "Off-Hours Access Attempt"),
    (["login_frequency"],                          "High-Frequency Probing"),
]


def explain_prediction(request_data: dict) -> dict:
    """
    Return a ranked list of feature contributions to the current prediction.
    Uses the model's native feature_importances_ where available,
    falls back to heuristic weights otherwise.
    """
    try:
        if model is not None and hasattr(model, "feature_importances_"):
            import pandas as pd
            df = pd.DataFrame([request_data])
            feature_names = df.columns.tolist()
            importances = model.feature_importances_

            contributions = []
            for fname, imp in zip(feature_names, importances):
                val = request_data.get(fname, 0)
                label = FEATURE_LABELS.get(fname, fname.replace("_", " ").title())
                direction = "increases risk" if imp > 0.05 and val > 0 else "low impact"
                contributions.append({
                    "feature": fname,
                    "label": label,
                    "importance": round(float(imp) * 100, 1),
                    "value": val,
                    "impact": direction,
                })
            contributions.sort(key=lambda x: -x["importance"])
            return {"method": "model_feature_importance", "contributions": contributions[:8]}
    except Exception:
        pass

    # Heuristic fallback
    heuristic = [
        {"feature": "failed_attempts",    "label": "Recent failed login attempts", "importance": min(40, request_data.get("failed_attempts", 0) * 10), "value": request_data.get("failed_attempts", 0),  "impact": "increases risk"},
        {"feature": "is_new_ip",          "label": "Login from unrecognised IP",   "importance": request_data.get("is_new_ip", 0) * 20,               "value": request_data.get("is_new_ip", 0),          "impact": "increases risk"},
        {"feature": "is_new_device",      "label": "Login from unrecognised device","importance": request_data.get("is_new_device", 0) * 15,           "value": request_data.get("is_new_device", 0),      "impact": "increases risk"},
        {"feature": "location_changed",   "label": "Location change detected",     "importance": request_data.get("location_changed", 0) * 15,         "value": request_data.get("location_changed", 0),   "impact": "increases risk"},
        {"feature": "login_frequency",    "label": "Login frequency",              "importance": min(25, request_data.get("login_frequency", 1) * 2),  "value": request_data.get("login_frequency", 1),    "impact": "may indicate automated access"},
        {"feature": "login_hour",         "label": "Login time of day",            "importance": 10 if (request_data.get("login_hour", 12) < 6 or request_data.get("login_hour", 12) > 22) else 2, "value": request_data.get("login_hour", 12), "impact": "off-hours access"},
    ]
    heuristic.sort(key=lambda x: -x["importance"])
    return {"method": "heuristic_fallback", "contributions": [h for h in heuristic if h["importance"] > 0]}


def categorize_attack(risk_score: float, reasons: list, request_data: dict) -> str:
    """Map current signals to the most likely attack category label."""
    for features, label in ATTACK_CATEGORY_MAP:
        if any(request_data.get(f, 0) > 0 for f in features):
            return label
    if risk_score >= 70:
        return "High-Risk Anomalous Activity"
    if risk_score >= 40:
        return "Moderate Risk Login"
    return "Normal Login Activity"

