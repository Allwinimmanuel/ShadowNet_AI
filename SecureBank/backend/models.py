from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    BANK_OPERATOR = "BANK_OPERATOR"
    ADMIN = "ADMIN"

class CustomerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    LOCKED = "LOCKED"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"

class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED_DEMO = "VERIFIED_DEMO"
    REJECTED_DEMO = "REJECTED_DEMO"

class AccountType(str, enum.Enum):
    SAVINGS = "SAVINGS"
    CURRENT = "CURRENT"
    FIXED_DEPOSIT = "FIXED_DEPOSIT"

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DORMANT = "DORMANT"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"

class TransactionType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL_SIMULATION = "WITHDRAWAL_SIMULATION"
    INTERNAL_TRANSFER = "INTERNAL_TRANSFER"
    BENEFICIARY_TRANSFER = "BENEFICIARY_TRANSFER"
    BILL_PAYMENT_SIMULATION = "BILL_PAYMENT_SIMULATION"
    SALARY_CREDIT_SIMULATION = "SALARY_CREDIT_SIMULATION"

class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REVERSED = "REVERSED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"

class BeneficiaryStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"
    TRUSTED = "TRUSTED"
    DISABLED = "DISABLED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default=UserRole.CUSTOMER.value)
    is_active = Column(Boolean, default=True)
    
    customer = relationship("Customer", back_populates="user", uselist=False)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    date_of_birth = Column(String, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String, default=CustomerStatus.ACTIVE.value)
    kyc_status = Column(String, default=KYCStatus.PENDING.value)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="customer")
    accounts = relationship("Account", back_populates="customer")
    beneficiaries = relationship("Beneficiary", back_populates="customer")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    account_number = Column(String, unique=True, index=True)
    account_type = Column(String, default=AccountType.SAVINGS.value)
    currency = Column(String, default="USD")
    available_balance = Column(Float, default=0.0)
    ledger_balance = Column(Float, default=0.0)
    minimum_balance = Column(Float, default=0.0)
    status = Column(String, default=AccountStatus.ACTIVE.value)
    branch_code = Column(String, default="DEMO-001")
    opened_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer = relationship("Customer", back_populates="accounts")
    transactions_sent = relationship("Transaction", foreign_keys="[Transaction.sender_account_id]", back_populates="sender_account")
    transactions_received = relationship("Transaction", foreign_keys="[Transaction.receiver_account_number]", primaryjoin="Account.account_number==Transaction.receiver_account_number", viewonly=True)

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    name = Column(String)
    nickname = Column(String, nullable=True)
    account_number = Column(String)
    bank_name = Column(String)
    status = Column(String, default=BeneficiaryStatus.UNVERIFIED.value)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    trusted_date = Column(DateTime, nullable=True)
    
    customer = relationship("Customer", back_populates="beneficiaries")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String, unique=True, index=True)
    sender_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    receiver_account_number = Column(String)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=True)
    amount = Column(Float)
    currency = Column(String, default="USD")
    transaction_type = Column(String)
    status = Column(String, default=TransactionStatus.PENDING.value)
    description = Column(String)
    initiated_ip = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    security_decision_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    sender_account = relationship("Account", foreign_keys=[sender_account_id], back_populates="transactions_sent")
    beneficiary = relationship("Beneficiary")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True)
    actor_id = Column(Integer, nullable=True) # User ID performing action
    action = Column(String)
    result = Column(String)
    source_ip = Column(String, nullable=True)
    related_reference = Column(String, nullable=True) # Account num, TX ref, etc
    security_decision_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
