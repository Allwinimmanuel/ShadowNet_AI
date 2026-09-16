import pandas as pd
import numpy as np
import random
import os

def generate_dataset(num_records=10000):
    print(f"Generating {num_records} synthetic login records...")
    
    np.random.seed(42)
    random.seed(42)
    
    # Pre-defined pools for normal behaviour
    browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"]
    device_types = ["Desktop", "Mobile", "Tablet"]
    locations = ["Chennai, India", "New York, USA", "London, UK", "Tokyo, Japan", "Sydney, Australia", "Berlin, Germany"]
    
    data = []
    
    for i in range(num_records):
        # 80% normal, 20% suspicious
        is_suspicious = np.random.rand() > 0.8
        
        user_id = f"USR{random.randint(1, 1000):04d}"
        email = f"{user_id.lower()}@example.com"
        
        # Base normal values
        login_hour = int(np.random.normal(loc=14, scale=4)) % 24
        day_of_week = random.randint(0, 6)
        account_age_days = random.randint(10, 1000)
        previous_successful_logins = random.randint(10, 500)
        
        if not is_suspicious:
            # Normal Behaviour
            ip_address = f"192.168.1.{random.randint(1, 50)}"
            device_type = random.choice(device_types)
            browser = random.choice(browsers)
            location = random.choice(locations)
            
            failed_attempts = random.choices([0, 1, 2], weights=[0.9, 0.08, 0.02])[0]
            login_frequency = random.randint(1, 10)
            time_since_last_login = random.randint(3600, 86400 * 3) # 1 hour to 3 days
            is_new_ip = random.choices([0, 1], weights=[0.95, 0.05])[0]
            is_new_device = random.choices([0, 1], weights=[0.98, 0.02])[0]
            location_changed = random.choices([0, 1], weights=[0.99, 0.01])[0]
            successful_login = 1 if failed_attempts == 0 else random.choice([0, 1])
            label = 0
            
        else:
            # Suspicious Behaviour
            # Attackers use new IPs, unknown locations, weird hours, lots of failed attempts
            ip_address = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
            device_type = random.choice(device_types)
            browser = random.choice(browsers)
            location = random.choice(locations)
            
            # Anomalies
            anomaly_type = random.choice(["brute_force", "new_location", "new_device_weird_time"])
            
            if anomaly_type == "brute_force":
                failed_attempts = random.randint(5, 50)
                login_frequency = random.randint(20, 100)
                time_since_last_login = random.randint(1, 60) # seconds
                is_new_ip = 1
                is_new_device = 1
                location_changed = 1
                login_hour = random.randint(0, 23)
            elif anomaly_type == "new_location":
                failed_attempts = random.randint(0, 3)
                login_frequency = random.randint(1, 10)
                time_since_last_login = random.randint(3600, 86400)
                is_new_ip = 1
                is_new_device = random.choice([0, 1])
                location_changed = 1
                location = "Unknown, Unknown"
            else: # new_device_weird_time
                failed_attempts = random.randint(0, 5)
                login_frequency = random.randint(5, 20)
                time_since_last_login = random.randint(60, 3600)
                is_new_ip = 1
                is_new_device = 1
                location_changed = random.choice([0, 1])
                login_hour = random.choice([2, 3, 4]) # unusual hours
                
            successful_login = 0
            label = 1
            
        record = {
            "user_id": user_id,
            "email": email,
            "ip_address": ip_address,
            "device_type": device_type,
            "browser": browser,
            "location": location,
            "login_hour": login_hour,
            "day_of_week": day_of_week,
            "failed_attempts": failed_attempts,
            "login_frequency": login_frequency,
            "time_since_last_login": time_since_last_login,
            "is_new_ip": is_new_ip,
            "is_new_device": is_new_device,
            "location_changed": location_changed,
            "account_age_days": account_age_days,
            "previous_successful_logins": previous_successful_logins,
            "successful_login": successful_login,
            "label": label
        }
        
        data.append(record)
        
    df = pd.DataFrame(data)
    
    # Save dataset
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "login_dataset.csv")
    df.to_csv(output_path, index=False)
    
    print(f"Dataset saved to {output_path}")
    print("\nLabel Distribution:")
    print(df['label'].value_counts(normalize=True))
    
if __name__ == "__main__":
    generate_dataset()
