from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import httpx
import uuid

import models
import schemas
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SecureBank API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SHADOWNET_API_URL = os.getenv("SHADOWNET_API_URL", "http://localhost:8000/api")
STRICT_SECURITY_MODE = os.getenv("STRICT_SECURITY_MODE", "false").lower() == "true"

@app.get("/")
def read_root():
    return {"message": "Welcome to SecureBank Management System API"}

@app.post("/api/auth/login")
async def login(request: schemas.SimpleLoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint integrated with ShadowNet AI.
    """
    user = db.query(models.User).filter(models.User.username == request.username).first()
    
    password_valid = False
    if user and user.password_hash == request.password: # Simplified for demo
        password_valid = True

    # 1. Prepare Security Context
    ip_addr = request.ip_address or "192.168.1.100"
    dev_type = request.device_type or "Desktop"
    browser_type = request.browser or "Chrome"
    loc = request.location or "New York, USA"
    hour = request.login_hour if request.login_hour is not None else datetime.now().hour

    is_new_ip = 1 if (request.ip_address and request.ip_address != "192.168.1.100") else 0
    is_new_device = 1 if (request.device_type and request.device_type != "Desktop") else 0
    location_changed = 1 if (request.location and request.location != "New York, USA") else 0

    security_context = {
        "user_id": request.username,
        "email": f"{request.username}@securebank.com",
        "ip_address": ip_addr,
        "device_type": dev_type,
        "browser": browser_type,
        "location": loc,
        "login_hour": hour,
        "day_of_week": datetime.now().weekday(),
        "failed_attempts": 0 if password_valid else 1,
        "login_frequency": 1,
        "is_new_ip": is_new_ip,
        "is_new_device": is_new_device,
        "location_changed": location_changed,
        "is_password_valid": password_valid
    }

    # 2. Call ShadowNet AI
    action = "ALLOWED"
    prediction = "NORMAL"
    risk_score = 0
    reasons = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{SHADOWNET_API_URL}/auth/analyze",
                json=security_context
            )
            if response.status_code == 200:
                result = response.json()
                action = result.get("recommended_action", "ALLOWED")
                prediction = result.get("prediction", "NORMAL")
                risk_score = result.get("risk_score", 0)
                reasons = result.get("reasons", [])
            else:
                if STRICT_SECURITY_MODE:
                    raise HTTPException(status_code=503, detail="Security service unavailable")
    except Exception as e:
        if STRICT_SECURITY_MODE:
            raise HTTPException(status_code=503, detail="Security service unavailable")
        print(f"ShadowNet AI unavailable, defaulting to ALLOWED. Error: {e}")

    # 3. Apply Decision
    if action in ["BLOCKED", "ACCOUNT_LOCKED", "BLOCKED_AND_DENIED"]:
        raise HTTPException(
            status_code=403, 
            detail={
                "message": "Access denied by security policy. Account has been locked due to repeated failed login attempts.",
                "action": action,
                "prediction": prediction,
                "risk_score": risk_score,
                "reasons": reasons
            }
        )
    
    if not password_valid:
        raise HTTPException(
            status_code=401, 
            detail={
                "message": "Suspicious login attempt flagged. Invalid credentials." if action in ["FLAG_SUSPICIOUS", "SUSPICIOUS"] else "Invalid username or password.",
                "action": action if action in ["FLAG_SUSPICIOUS", "SUSPICIOUS"] else "DENIED",
                "prediction": prediction,
                "risk_score": risk_score,
                "reasons": reasons
            }
        )
        
    if action in ["HELD", "SUSPICIOUS", "FLAG_SUSPICIOUS"]:
        # Simulate requiring MFA
        return {
            "success": True, 
            "message": "MFA challenge required.", 
            "token": None, 
            "action": action,
            "prediction": prediction,
            "risk_score": risk_score,
            "reasons": reasons
        }

    # Success
    return {
        "success": True, 
        "message": "Login successful.", 
        "token": f"mock-jwt-token-{uuid.uuid4().hex}",
        "role": user.role if user else "CUSTOMER",
        "action": action,
        "prediction": prediction,
        "risk_score": risk_score,
        "reasons": reasons
    }

@app.post("/api/transactions/transfer")
async def transfer_funds(request: schemas.TransactionRequest, db: Session = Depends(get_db)):
    """
    Simulate a fund transfer with ShadowNet AI transaction risk analysis.
    """
    # 0. Validate User & Account
    user = db.query(models.User).filter(models.User.username == request.username).first()
    if not user or not user.customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    sender_account = db.query(models.Account).filter(
        models.Account.account_number == request.sender_account_number,
        models.Account.customer_id == user.customer.id
    ).first()
    
    if not sender_account:
        raise HTTPException(status_code=404, detail="Sender account not found")
        
    if sender_account.available_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # 1. Prepare Security Context
    security_context = {
        "amount": request.amount,
        "recent_failed_authentication_count": 0,
        "sender_account": request.sender_account_number,
        "receiver_account": request.receiver_account_number
    }
    
    # 2. Call ShadowNet AI Transaction Analysis
    action = "ALLOWED"
    decision_id = None
    reason = "Normal"
    risk_score = 0
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{SHADOWNET_API_URL}/transactions/analyze",
                json=security_context
            )
            if response.status_code == 200:
                result = response.json()
                action = result.get("recommended_action", "ALLOWED")
                decision_id = result.get("security_decision_id")
                reason = result.get("reason", "Analysis complete")
                risk_score = result.get("risk_score", 0)
            else:
                if STRICT_SECURITY_MODE:
                    raise HTTPException(status_code=503, detail="Security service unavailable")
    except Exception as e:
        if STRICT_SECURITY_MODE:
            raise HTTPException(status_code=503, detail="Security service unavailable")
        
    # 3. Apply Decision
    if action == "BLOCKED":
        status_str = "BLOCKED"
        message = f"Transaction blocked: {reason}"
    elif action == "HELD" or action == "SUSPICIOUS":
        status_str = "PENDING"
        message = f"Transaction held for review: {reason}"
    else:
        status_str = "COMPLETED"
        message = "Transfer completed successfully."
        # Deduct balance
        sender_account.available_balance -= request.amount
        sender_account.ledger_balance -= request.amount
        
    # Save transaction to DB
    new_tx = models.Transaction(
        reference_number=f"TRX-{uuid.uuid4().hex[:8].upper()}",
        sender_account_id=sender_account.id,
        receiver_account_number=request.receiver_account_number,
        amount=-request.amount,
        currency=request.currency,
        transaction_type=request.transaction_type,
        status=status_str,
        description=request.description,
        security_decision_id=decision_id
    )
    db.add(new_tx)
    db.commit()
    
    if action == "BLOCKED":
        raise HTTPException(status_code=403, detail={"message": message, "risk_score": risk_score})
        
    return {
        "success": True,
        "message": message,
        "status": status_str,
        "security_decision_id": decision_id,
        "risk_score": risk_score,
        "action": action
    }

@app.get("/api/transactions/history/{username}")
async def get_transaction_history(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not user.customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    transactions = []
    for acc in user.customer.accounts:
        for tx in acc.transactions_sent:
            transactions.append({
                "id": tx.reference_number,
                "date": tx.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "description": tx.description,
                "account": acc.account_number,
                "receiver": tx.receiver_account_number,
                "amount": tx.amount,
                "status": tx.status,
                "timestamp": tx.created_at
            })
            
    transactions.sort(key=lambda x: x["timestamp"], reverse=True)
    for tx in transactions:
        del tx["timestamp"]
        
    return {"transactions": transactions}

@app.get("/api/accounts/dashboard/{username}")
async def get_dashboard(username: str, db: Session = Depends(get_db)):
    """
    Fetch customer dashboard data dynamically.
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not user.customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    customer = user.customer
    
    # Get Accounts
    accounts_data = []
    for acc in customer.accounts:
        accounts_data.append({
            "type": acc.account_type.capitalize(),
            "number": acc.account_number,
            "balance": acc.available_balance,
            "available": acc.available_balance,
            "currency": acc.currency
        })
        
    # Get Recent Transactions (mock fetching from all accounts)
    transactions = []
    for acc in customer.accounts:
        for tx in acc.transactions_sent:
            transactions.append({
                "id": tx.reference_number,
                "date": tx.created_at.strftime("%Y-%m-%d"),
                "description": tx.description,
                "amount": tx.amount,
                "status": tx.status,
                "risk": "LOW" if tx.status == "COMPLETED" else "HIGH",
                "timestamp": tx.created_at
            })
            
    # Sort transactions by date descending
    transactions.sort(key=lambda x: x["timestamp"], reverse=True)
    # Remove timestamp before returning
    for tx in transactions:
        del tx["timestamp"]
        
    return {
        "name": customer.full_name,
        "customerId": f"CUST-{customer.id:06d}",
        "lastLogin": datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p"),
        "accounts": accounts_data,
        "recentTransactions": transactions[:5]
    }
