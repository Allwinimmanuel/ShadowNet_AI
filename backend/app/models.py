from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    ip_address = Column(String)
    device_type = Column(String)
    browser = Column(String)
    operating_system = Column(String)
    location = Column(String)
    login_hour = Column(Integer)
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    successful_login = Column(Boolean, default=False)
    failed_attempts = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String)
    prediction = Column(String) # NORMAL or SUSPICIOUS
    attack_type = Column(String)
    action_taken = Column(String) # ALLOW_LOGIN, BLOCK_AND_VERIFY, etc.
    failure_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserLoginPattern(Base):
    __tablename__ = "user_login_patterns"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    frequent_ip = Column(String)
    frequent_device = Column(String)
    frequent_location = Column(String)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SecurityIncident(Base):
    __tablename__ = "security_incidents"
    id = Column(Integer, primary_key=True, index=True)
    login_attempt_id = Column(Integer)
    threat_type = Column(String)
    username = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    severity = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(String)
    prevention_action = Column(String)
    status = Column(String, default="OPEN") # OPEN, RESOLVED
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BlockedIP(Base):
    __tablename__ = "blocked_ips"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    blocked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

class AccountLock(Base):
    __tablename__ = "account_locks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    reason = Column(String)
    locked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
