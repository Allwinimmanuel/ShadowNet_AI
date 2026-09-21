from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    full_name: str
    email: EmailStr
    phone: str

class SimpleLoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class CustomerBase(BaseModel):
    full_name: str
    email: str
    phone: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    user_id: int
    status: str
    kyc_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountResponse(BaseModel):
    id: int
    customer_id: int
    account_number: str
    account_type: str
    currency: str
    available_balance: float
    ledger_balance: float
    status: str
    branch_code: str
    opened_at: datetime
    
    class Config:
        from_attributes = True

class TransactionRequest(BaseModel):
    username: str
    sender_account_number: str
    receiver_account_number: str
    amount: float
    currency: str = "USD"
    transaction_type: str
    description: str

class TransactionResponse(BaseModel):
    id: int
    reference_number: str
    sender_account_id: Optional[int]
    receiver_account_number: str
    amount: float
    currency: str
    transaction_type: str
    status: str
    description: str
    security_decision_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class BeneficiaryRequest(BaseModel):
    name: str
    nickname: Optional[str] = None
    account_number: str
    bank_name: str

class BeneficiaryResponse(BeneficiaryRequest):
    id: int
    customer_id: int
    status: str
    created_at: datetime
    trusted_date: Optional[datetime]
    
    class Config:
        from_attributes = True
