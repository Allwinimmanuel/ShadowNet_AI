from sqlalchemy import Column, Integer, String, Float, Boolean
from core.database import Base

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, index=True)
    user_id = Column(String, index=True)
    username = Column(String)
    ip_address = Column(String)
    location = Column(String)
    device = Column(String)
    event_type = Column(String)
    login_status = Column(String)
    failed_attempts = Column(Integer, default=0)
    data_download_mb = Column(Float, default=0.0)
    files_accessed = Column(Integer, default=0)
    file_modifications = Column(Integer, default=0)
    process_activity = Column(Float, default=0.0)
    
    # AI Predictions
    anomaly_score = Column(Float, nullable=True)
    predicted_threat = Column(String, nullable=True)
    threat_confidence = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
