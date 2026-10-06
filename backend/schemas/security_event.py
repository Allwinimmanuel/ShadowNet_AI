from pydantic import BaseModel
from typing import Optional

class SecurityEventBase(BaseModel):
    timestamp: str
    user_id: str
    username: str
    ip_address: str
    location: str
    device: str
    event_type: str
    login_status: str
    failed_attempts: int = 0
    data_download_mb: float = 0.0
    files_accessed: int = 0
    file_modifications: int = 0
    process_activity: float = 0.0

class SecurityEventCreate(SecurityEventBase):
    pass

class SecurityEvent(SecurityEventBase):
    id: int
    anomaly_score: Optional[float] = None
    predicted_threat: Optional[str] = None
    threat_confidence: Optional[float] = None
    risk_score: Optional[float] = None

    class Config:
        from_attributes = True
