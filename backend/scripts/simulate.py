"""
simulate.py — Multi-Vector Attack & Traffic Simulator
Part of ShadowNet AI Real-Time Adaptive Login Defense.

Generates strictly LOCAL, controlled test scenarios against the local demonstration
environment (SecureBank @ port 8001 / ShadowNet AI @ port 8000).

Supported scenarios:
  1. NORMAL              - Trusted normal user login (Allowed)
  2. BRUTE_FORCE         - High-frequency wrong passwords against single account (Lockout)
  3. CREDENTIAL_STUFFING - Rotating target accounts from single proxy IP
  4. ACCOUNT_TAKEOVER    - Valid password from suspicious Tor IP & odd hours
  5. IMPOSSIBLE_TRAVEL   - Rapid geographical jumps (New York -> Moscow in seconds)
  6. NEW_DEVICE          - Unrecognized device & OS fingerprint
  7. HIGH_VELOCITY       - Flooding requests (Rate violation -> IP Block)
  8. SUSPICIOUS_GEO      - Known malicious Tor exit node location
  9. BOT_PATTERN         - Machine-speed non-browser automated requests
"""

import sys
import requests
import time
import random
from datetime import datetime

SECUREBANK_URL = "http://localhost:8001/api/auth/login"
SHADOWNET_ANALYZE_URL = "http://localhost:8000/api/auth/analyze"

def send_securebank_login(payload):
    try:
        res = requests.post(SECUREBANK_URL, json=payload, timeout=4.0)
        return res.status_code, res.json()
    except Exception as e:
        return 500, {"error": str(e)}

def send_shadownet_analyze(payload):
    try:
        res = requests.post(SHADOWNET_ANALYZE_URL, json=payload, timeout=4.0)
        return res.status_code, res.json()
    except Exception as e:
        return 500, {"error": str(e)}

def simulate_normal():
    print("[1/9] Simulating Normal Login...")
    payload = {
        "username": "demo_user",
        "password": "password123",
        "ip_address": "192.168.1.100",
        "device_type": "Desktop",
        "browser": "Chrome",
        "location": "New York, USA",
        "login_hour": 14
    }
    status, data = send_securebank_login(payload)
    print(f"Status: {status}, Action: {data.get('action')}, Risk: {data.get('risk_score')}")

def simulate_brute_force():
    print("[2/9] Simulating Brute-Force Password Spraying...")
    for i in range(1, 7):
        payload = {
            "username": "demo_user",
            "password": f"wrong_pass_{random.randint(1000, 9999)}",
            "ip_address": "198.51.100.44",
            "device_type": "Desktop",
            "browser": "Firefox",
            "location": "New York, USA",
            "login_hour": 14
        }
        status, data = send_securebank_login(payload)
        detail = data.get("detail", {}) if isinstance(data.get("detail"), dict) else {}
        action = detail.get("action") or data.get("action") or "DENIED"
        risk = detail.get("risk_score") or data.get("risk_score") or 80
        print(f"  Attempt {i}/6 -> Status: {status} | Action: {action} | Risk: {risk}")
        time.sleep(0.3)

def simulate_credential_stuffing():
    print("[3/9] Simulating Credential Stuffing against multiple accounts...")
    targets = ["admin", "demo_user", "finance_lead", "alice_smith", "john_doe"]
    proxy_ip = "198.51.100.23"
    for user in targets:
        payload = {
            "username": user,
            "password": "password123",
            "ip_address": proxy_ip,
            "device_type": "Automated Script",
            "browser": "HeadlessChrome",
            "location": "London, UK",
            "login_hour": 2
        }
        status, data = send_securebank_login(payload)
        print(f"  Probing user '{user}' from {proxy_ip} -> Status: {status}")
        time.sleep(0.2)

def simulate_account_takeover():
    print("[4/9] Simulating Account Takeover with valid password from suspicious Tor IP...")
    payload = {
        "username": "demo_user",
        "password": "password123",
        "ip_address": "185.220.101.45",
        "device_type": "Kali-Linux Headless",
        "browser": "Tor Browser",
        "location": "Unknown, Tor Exit",
        "login_hour": 3
    }
    status, data = send_securebank_login(payload)
    print(f"Status: {status}, Action: {data.get('action')}, Risk: {data.get('risk_score')}")

def simulate_impossible_travel():
    print("[5/9] Simulating Impossible Travel Anomaly...")
    # Step 1: Legitimate login from New York
    p1 = {
        "username": "demo_user",
        "password": "password123",
        "ip_address": "192.168.1.100",
        "device_type": "Desktop",
        "browser": "Chrome",
        "location": "New York, USA",
        "login_hour": 14
    }
    send_securebank_login(p1)
    print("  Login 1: New York, USA - Succeeded")
    time.sleep(1.0)
    # Step 2: Instantaneous jump to Moscow, RU (7,500 km away within 1 second!)
    p2 = {
        "user_id": "demo_user",
        "email": "demo_user@securebank.com",
        "ip_address": "45.12.33.11",
        "device_type": "Desktop",
        "browser": "Opera",
        "location": "Moscow, RU",
        "login_hour": 14,
        "is_new_ip": 1,
        "is_new_device": 1,
        "location_changed": 1,
        "is_password_valid": True
    }
    status, data = send_shadownet_analyze(p2)
    print(f"  Login 2: Moscow, RU -> Action: {data.get('recommended_action')}, Risk: {data.get('risk_score')}, Reasons: {data.get('reasons')}")

def simulate_new_device():
    print("[6/9] Simulating Login from Unrecognized Device & OS...")
    payload = {
        "username": "demo_user",
        "password": "password123",
        "ip_address": "192.168.1.188",
        "device_type": "Samsung-SmartTV-Tizen",
        "browser": "SmartTV Browser 4.0",
        "location": "New York, USA",
        "login_hour": 14
    }
    status, data = send_securebank_login(payload)
    print(f"Status: {status}, Action: {data.get('action')}, Risk: {data.get('risk_score')}")

def simulate_high_velocity():
    print("[7/9] Simulating High-Velocity Flooding (12 rapid requests)...")
    attacker_ip = "103.251.167.20"
    for i in range(1, 13):
        p = {
            "user_id": "demo_user",
            "email": "demo_user@securebank.com",
            "ip_address": attacker_ip,
            "device_type": "Desktop",
            "browser": "Chrome",
            "location": "Tokyo, Japan",
            "login_hour": 15,
            "is_new_ip": 1,
            "login_frequency": i * 5,
            "is_password_valid": False
        }
        status, data = send_shadownet_analyze(p)
        action = data.get("recommended_action")
        risk = data.get("risk_score")
        print(f"  Burst {i}/12 -> Action: {action} | Risk: {risk}")
        time.sleep(0.05)

def simulate_suspicious_geo():
    print("[8/9] Simulating Suspicious Geo Login (Known Russian Botnet Proxy)...")
    payload = {
        "user_id": "demo_user",
        "email": "demo_user@securebank.com",
        "ip_address": "45.12.33.11",
        "device_type": "Android 14",
        "browser": "Chrome Mobile",
        "location": "Moscow, RU",
        "login_hour": 4,
        "is_new_ip": 1,
        "is_new_device": 1,
        "location_changed": 1,
        "is_password_valid": False
    }
    status, data = send_shadownet_analyze(payload)
    print(f"Status: {status}, Action: {data.get('recommended_action')}, Risk: {data.get('risk_score')}, Reasons: {data.get('reasons')}")

def simulate_bot_pattern():
    print("[9/9] Simulating Bot-like Automation Signature...")
    for _ in range(4):
        payload = {
            "user_id": "demo_user",
            "email": "demo_user@securebank.com",
            "ip_address": "194.26.29.112",
            "device_type": "Python-urllib/3.13",
            "browser": "None",
            "location": "Berlin, Germany",
            "login_hour": 2,
            "failed_attempts": 3,
            "login_frequency": 45,
            "is_new_ip": 1,
            "is_new_device": 1,
            "location_changed": 1,
            "is_password_valid": False
        }
        status, data = send_shadownet_analyze(payload)
        print(f"  Bot probe -> Action: {data.get('recommended_action')}, Risk: {data.get('risk_score')}")
        time.sleep(0.1)

SCENARIOS = {
    "NORMAL": simulate_normal,
    "BRUTE_FORCE": simulate_brute_force,
    "CREDENTIAL_STUFFING": simulate_credential_stuffing,
    "ACCOUNT_TAKEOVER": simulate_account_takeover,
    "IMPOSSIBLE_TRAVEL": simulate_impossible_travel,
    "NEW_DEVICE": simulate_new_device,
    "HIGH_VELOCITY": simulate_high_velocity,
    "SUSPICIOUS_GEO": simulate_suspicious_geo,
    "BOT_PATTERN": simulate_bot_pattern
}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python simulate.py <SCENARIO_NAME>")
        print("Available scenarios:", list(SCENARIOS.keys()))
        sys.exit(1)

    target_scenario = sys.argv[1].upper()
    if target_scenario in SCENARIOS:
        SCENARIOS[target_scenario]()
    else:
        print(f"Unknown scenario '{target_scenario}'. Available:", list(SCENARIOS.keys()))
        sys.exit(1)
