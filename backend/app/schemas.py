from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SimpleLoginRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    user_id: str
    email: str
    ip_address: str
    device_type: str
    browser: Optional[str] = "Unknown"
    location: str
    login_hour: int
    day_of_week: int = 0
    failed_attempts: int = 0
    login_frequency: int = 1
    time_since_last_login: int = 86400
    is_new_ip: int = 0
    is_new_device: int = 0
    location_changed: int = 0
    account_age_days: int = 30
    previous_successful_logins: int = 10

class PredictionResponse(BaseModel):
    prediction: str
    risk_score: float
    confidence: float
    reasons: List[str]
    recommended_action: str

class IncidentResponse(BaseModel):
    id: int
    login_attempt_id: int
    threat_type: str
    username: Optional[str] = None
    ip_address: Optional[str] = None
    severity: str
    description: str
    prevention_action: str
    status: str
    resolved: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    total_attempts: int
    normal_logins: int
    suspicious_logins: int
    blocked_attempts: int
    active_incidents: int
