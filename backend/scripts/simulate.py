import sys
import requests
import time
import random

SECUREBANK_URL = "http://localhost:8001/api/auth/login"

def simulate_normal():
    for _ in range(3):
        requests.post(SECUREBANK_URL, json={'username': 'demo_user', 'password': 'demo_password'})
        time.sleep(0.5)

def simulate_brute_force():
    for _ in range(12):
        requests.post(SECUREBANK_URL, json={'username': 'demo_user', 'password': f'wrongpass{random.randint(100, 999)}'})
        time.sleep(0.1)

def simulate_credential_stuffing():
    usernames = ['admin', 'demo_user', 'test_user', 'john_doe', 'alice']
    for user in usernames:
        for _ in range(2):
            requests.post(SECUREBANK_URL, json={'username': user, 'password': 'password123'})
            time.sleep(0.2)

def simulate_anomalous_location():
    # This requires mocking the IP or modifying the login request.
    # Since SecureBank uses the request IP, we can hit ShadowNet AI directly.
    SHADOWNET_URL = "http://localhost:8000/api/auth/analyze"
    payload = {
        "user_id": "demo_user",
        "ip_address": "45.12.33.11", # Mock Russian/Chinese IP
        "device_type": "Unknown",
        "browser": "Tor",
        "location": "Moscow, RU",
        "login_hour": 3,
        "successful_login": False,
        "failed_attempts": 2
    }
    requests.post(SHADOWNET_URL, json=payload)
    
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: simulate.py <scenario>")
        sys.exit(1)
        
    scenario = sys.argv[1]
    if scenario == "NORMAL":
        simulate_normal()
    elif scenario == "BRUTE_FORCE":
        simulate_brute_force()
    elif scenario == "CREDENTIAL_STUFFING":
        simulate_credential_stuffing()
    elif scenario == "ANOMALOUS_LOCATION":
        simulate_anomalous_location()
    else:
        print(f"Unknown scenario: {scenario}")
