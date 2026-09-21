import database, models
import datetime
from database import SessionLocal

def seed():
    db = SessionLocal()
    
    # Create Demo Customer
    if not db.query(models.User).filter(models.User.username == "demo_user").first():
        user = models.User(
            username="demo_user",
            password_hash="password123", # Plain text just for testing demonstration
            role="CUSTOMER"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        customer = models.Customer(
            user_id=user.id,
            full_name="John Doe",
            email="johndoe@securebank.demo",
            phone="555-0100",
            kyc_status="VERIFIED_DEMO"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        account1 = models.Account(
            customer_id=customer.id,
            account_number="**** **** 4921",
            account_type="CURRENT", # Checking
            available_balance=14500.50,
            ledger_balance=14500.50
        )
        account2 = models.Account(
            customer_id=customer.id,
            account_number="**** **** 8832",
            account_type="SAVINGS",
            available_balance=52000.00,
            ledger_balance=52000.00
        )
        db.add_all([account1, account2])
        db.commit()
        db.refresh(account1)
        
        t1 = models.Transaction(
            reference_number="TRX-1001",
            sender_account_id=account1.id,
            receiver_account_number="External",
            amount=-120.50,
            transaction_type="BILL_PAYMENT_SIMULATION",
            status="COMPLETED",
            description="Amazon.com",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        )
        t2 = models.Transaction(
            reference_number="TRX-1002",
            sender_account_id=account1.id,
            receiver_account_number="External",
            amount=4500.00,
            transaction_type="SALARY_CREDIT_SIMULATION",
            status="COMPLETED",
            description="Salary Deposit",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        t3 = models.Transaction(
            reference_number="TRX-1003",
            sender_account_id=account1.id,
            receiver_account_number="External",
            amount=-5000.00,
            transaction_type="BENEFICIARY_TRANSFER",
            status="BLOCKED",
            description="Unknown Transfer",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
        )
        db.add_all([t1, t2, t3])
        db.commit()
        
        print("Seed data successfully added.")
    else:
        print("Seed data already exists. To re-seed, drop database.")
        
if __name__ == "__main__":
    models.Base.metadata.create_all(bind=database.engine)
    seed()
