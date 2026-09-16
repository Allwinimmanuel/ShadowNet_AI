import pandas as pd
import numpy as np
import os
import joblib
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def train_model():
    print("Loading dataset...")
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "login_dataset.csv")
    df = pd.read_csv(data_path)
    
    X = df.drop(columns=['user_id', 'email', 'label', 'successful_login'])
    y = df['label']
    
    numeric_features = ['login_hour', 'day_of_week', 'failed_attempts', 'login_frequency', 
                        'time_since_last_login', 'is_new_ip', 'is_new_device', 'location_changed', 
                        'account_age_days', 'previous_successful_logins']
    categorical_features = ['ip_address', 'device_type', 'browser', 'location']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'))
    ])
    
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred), # Prioritizing recall
        "f1_score": f1_score(y_test, y_pred)
    }
    
    print(f"Metrics: {metrics}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")
    
    # Save model and metadata
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "login_attack_model.joblib")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    metadata = {
        "model_name": "RandomForestClassifier",
        "training_date": datetime.now().isoformat(),
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "metrics": metrics,
        "threshold": 0.5
    }
    
    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Metadata saved to {metadata_path}")

if __name__ == "__main__":
    train_model()
