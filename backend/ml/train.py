import sys
import os
import pickle
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.database import SessionLocal
from models.security_event import SecurityEvent

def train_model():
    print("Fetching data from database...")
    db: Session = SessionLocal()
    events = db.query(SecurityEvent).all()
    db.close()
    
    if not events:
        print("No data found! Please run data/generate_data.py first.")
        return
        
    print(f"Loaded {len(events)} events for training.")
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'id': e.id,
        'event_type': e.event_type,
        'login_status': e.login_status,
        'failed_attempts': e.failed_attempts,
        'data_download_mb': e.data_download_mb,
        'files_accessed': e.files_accessed,
        'process_activity': e.process_activity,
        'file_modifications': e.file_modifications
    } for e in events])
    
    # Feature Engineering
    print("Preprocessing data...")
    le_event = LabelEncoder()
    le_login = LabelEncoder()
    
    df['event_type_encoded'] = le_event.fit_transform(df['event_type'])
    df['login_status_encoded'] = le_login.fit_transform(df['login_status'])
    
    features = ['event_type_encoded', 'login_status_encoded', 'failed_attempts', 
                'data_download_mb', 'files_accessed', 'process_activity', 'file_modifications']
                
    X = df[features]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    print("Training Isolation Forest anomaly detector...")
    model = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
    model.fit(X_scaled)
    
    # Save the model and preprocessors
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    model_path = os.path.join(os.path.dirname(__file__), "isolation_forest.pkl")
    
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'scaler': scaler,
            'le_event': le_event,
            'le_login': le_login,
            'features': features
        }, f)
        
    print(f"Model successfully trained and saved to {model_path}!")

if __name__ == "__main__":
    train_model()
