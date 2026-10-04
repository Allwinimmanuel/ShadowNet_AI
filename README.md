# 🛡️ ShadowNet AI — Real-Time Adaptive Login Defense & Behavioral Threat Prevention

> **“Traditional authentication asks whether the password is correct. ShadowNet AI asks whether the LOGIN BEHAVIOR is trustworthy.”**

---

## 🌟 Executive Summary

Standard enterprise authentication systems suffer from a critical architectural vulnerability: **they perform binary credential validation (`Input == Hash`) while ignoring the rich contextual telemetry surrounding the login event.** 

As a consequence:
- **Credential Stuffing** bots weaponize millions of leaked credentials with zero resistance.
- **Account Takeover (ATO)** occurs silently when stolen credentials are used from foreign Tor exit nodes at 3:00 AM.
- **Brute-Force & Password Spraying** attacks evade detection by spreading attempts across distributed IP farms.

**ShadowNet AI** is a real-time, AI-driven cybersecurity middleware and Security Operations Center (SOC) platform. It intercepts every login attempt, extracts behavioral telemetry, and executes a multi-signal **Risk Fusion Engine** (combining Machine Learning, Deterministic Rules, UEBA behavioral baselines, and Threat Intelligence) to output a calibrated **0–100 Risk Score** with **Explainable AI (XAI)** reasoning in under 15 milliseconds.

---

## 🏛️ System Architecture

```
                       [ USER / ATTACKER ]
                               │
                               ▼
                   [ TARGET: SECUREBANK APP ]
                               │
                               ▼ (Context: IP, Device, Time, Geo, Velocity)
                   [ LOGIN SECURITY GATEWAY ]
                               │
                               ▼
                  [ SHADOWNET AI ENGINE ]
   ┌───────────────────┬───────────────────┬───────────────────┐
   │                   │                   │                   │
   ▼                   ▼                   ▼                   ▼
[ ML ENGINE ]   [ RULE ENGINE ]     [ UEBA ENGINE ]     [ THREAT INTEL ]
(RandomForest)  (Lockout/Limits)   (Behavior Baseline)  (Reputation/Geo)
   │                   │                   │                   │
   └───────────────────┼───────────────────┼───────────────────┘
                       ▼
           [ MULTI-SIGNAL RISK FUSION ]
                       │ (0 – 100 Score)
                       ▼
           [ EXPLAINABLE AI (XAI) LAYER ]
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
     [ ALLOW ]   [ CHALLENGE ]   [ BLOCK ]
         │             │             │
         └─────────────┼─────────────┘
                       ▼
         [ REAL-TIME SOC OPERATIONS DASHBOARD ]
         │
   ┌─────┴─────────────┬─────────────────────┐
   ▼                   ▼                     ▼
[ INCIDENTS ]   [ USER RISK PROFILES ]  [ ATTACK SIMULATOR ]
```

---

## 🧠 The Multi-Signal Risk Fusion Engine

ShadowNet AI eliminates black-box AI opacity through an additive, mathematically transparent scoring engine:

$$\text{Final Risk Score} = \min\left(100, \sum \text{Signal Weights}\right)$$

### Evaluated Signals & Evidence:
| Category | Evaluated Signal | Typical Weight | Evidence / Trigger Condition |
| :--- | :--- | :--- | :--- |
| **Authentication** | High Failed Attempt Sequence | $+45$ | $\ge 5$ consecutive failed password attempts |
| **Velocity** | Request Rate Burst | $+35$ | $\ge 10$ requests / minute from single IP |
| **Impossible Travel** | Geo-Velocity Anomaly | $+35$ | Physical distance $> 1,000\text{ km}$ traversed in $< 2\text{ hours}$ |
| **Threat Intel** | Flagged Botnet / Tor Node | $+30$ | IP matches known Tor exit node or C2 proxy list |
| **UEBA Device** | Unfamiliar Device Fingerprint | $+20$ | Device OS/Browser not in verified user baseline |
| **UEBA Geo** | New Geographic Region | $+18$ | First time connecting from foreign country/city |
| **UEBA Time** | Off-Hours Anomaly | $+12$ | Login attempt outside user's habitual active window |
| **Machine Learning** | Random Forest Risk Prediction | $+25$ | ML classification score ($P_{\text{suspicious}} \times 25$) |

---

## 🎯 Explainable AI (XAI) in Action

When ShadowNet blocks an attack, the SOC analyst receives clear, human-understandable evidence rather than an ambiguous rejection:

```json
{
  "final_risk_score": 92.0,
  "action": "ACCOUNT_LOCKED",
  "prediction": "BRUTE_FORCE",
  "confidence": 0.96,
  "breakdown": [
    { "category": "AUTHENTICATION", "signal": "High consecutive failed attempts", "points": 45, "evidence": "6 consecutive failures recorded" },
    { "category": "VELOCITY", "signal": "Extreme login velocity", "points": 35, "evidence": "12 requests in 60s from 198.51.100.44" },
    { "category": "UEBA_DEVICE", "signal": "Unfamiliar Device Fingerprint", "points": 20, "evidence": "Device 'Kali-Linux' not in user baseline" }
  ],
  "reasons": [
    "Exceeded maximum failed attempts (5). Account locked.",
    "Extreme request velocity detected",
    "Unrecognized device fingerprint"
  ]
}
```

---

## 🚀 9-Vector Attack Simulator Catalog

ShadowNet includes a local attack simulator capable of generating live HTTP scenarios against the victim **SecureBank** application:

1. **Normal Trusted Login:** Legitimate employee login from habitual IP during normal hours $\rightarrow$ **ALLOWED (Risk: 0)**.
2. **Brute-Force Password Spraying:** 6 rapid failed attempts with random passwords $\rightarrow$ **ACCOUNT_LOCKED (Risk: 95+)**.
3. **Credential Stuffing Attack:** Rotating target accounts (`admin`, `demo_user`, `finance_lead`) from a single proxy IP $\rightarrow$ **BLOCK_IP (Risk: 85+)**.
4. **Account Takeover via Tor:** Valid credentials supplied from a flagged Tor Exit node at 3:00 AM $\rightarrow$ **FLAG_SUSPICIOUS (Risk: 75+)**.
5. **Impossible Travel Anomaly:** Login in New York followed 1 second later by an attempt in Moscow (7,500 km jump) $\rightarrow$ **FLAG_SUSPICIOUS / DENIED (Risk: 80+)**.
6. **Unfamiliar Device Anomaly:** Connection from an unrecognized Smart TV / Tizen OS user agent $\rightarrow$ **FLAG_SUSPICIOUS (Risk: 45+)**.
7. **High-Velocity Flooding:** 12 rapid requests in under 3 seconds $\rightarrow$ **BLOCK_IP (Risk: 90+)**.
8. **Flagged Botnet Geo-Location:** Originating from a known Russian C2 proxy subnet $\rightarrow$ **FLAG_SUSPICIOUS (Risk: 70+)**.
9. **Scripted Bot Fingerprint:** Automated Python-urllib client lacking browser headers $\rightarrow$ **DENIED (Risk: 80+)**.

---

## 💻 Tech Stack & Infrastructure

- **Backend:** FastAPI (Python 3.13), SQLAlchemy ORM, Uvicorn, Scikit-learn (RandomForestClassifier), NumPy, Pandas, Bcrypt, PyJWT.
- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, Lucide-React.
- **Victim App:** SecureBank (Dedicated online banking simulation on port 5174).
- **Latency:** Sub-15ms ML evaluation per login request.

---

## ⚡ Quickstart & Demonstration Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### One-Click Demo Startup
Run the unified demonstration launcher from the repository root:
```cmd
start_demo.bat
```
This automatically spins up all 4 microservices:
1. **ShadowNet AI SOC Dashboard:** [http://localhost:5173](http://localhost:5173)
2. **ShadowNet AI Backend API:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
3. **SecureBank Banking Portal:** [http://localhost:5174](http://localhost:5174)
4. **SecureBank Backend API:** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

### Demo Credentials
- **SOC Security Dashboard:**
  - **Username:** `USR001`
  - **Password:** `Demo@123` *(Admin Privileges)*
- **SecureBank Customer Portal:**
  - **Username:** `demo_user`
  - **Password:** `password123`

---

## 🧪 Running the Test Suite

Run the automated integration and security test suite:
```bash
python tests/run_all_tests.py
```
**Test Coverage:**
- ✅ Health check & database connectivity
- ✅ Normal login evaluation
- ✅ Suspicious context anomaly flagging
- ✅ Brute-force detection and automated account lockout
- ✅ Locked account enforcement
- ✅ High-frequency IP attack and automated IP blocking
- ✅ Blocked IP enforcement
- ✅ Invalid credential handling

---

## 📁 Repository Structure

```
ShadowNet_AI/
├── backend/
│   ├── app/
│   │   ├── auth.py             # JWT authentication & role-based access control
│   │   ├── database.py         # SQLAlchemy engine & session management
│   │   ├── main.py             # FastAPI REST endpoints & middleware
│   │   ├── ml_service.py       # Random Forest inference & feature attribution
│   │   ├── models.py           # Database schemas (Users, Incidents, Attempts, Locks)
│   │   ├── prevention.py       # Automated policy enforcement & incident dispatch
│   │   ├── risk_engine.py      # Multi-Signal Risk Fusion & XAI Engine
│   │   ├── schemas.py          # Pydantic request/response data contracts
│   │   ├── threat_intel.py     # IP reputation & sequence analysis
│   │   └── ueba.py             # User behavioral baselining & anomaly engine
│   ├── models/                 # Serialized ML model & metadata
│   └── scripts/
│       ├── generate_dataset.py # Synthetic telemetry generator
│       ├── seed_demo_data.py   # Baseline historical data seeder
│       ├── simulate.py         # 9-vector local attack generator
│       └── train_model.py      # Random Forest training pipeline
├── frontend/
│   └── src/
│       ├── components/         # Layout, ProtectedRoute, Navigation
│       ├── pages/
│       │   ├── DemoManager.jsx     # 9-Attack Vector Suite & Judge Story Mode
│       │   ├── Incidents.jsx       # Incident Response & Analyst Remediation
│       │   ├── LoginSimulator.jsx  # Contextual Simulator & XAI Breakdown
│       │   ├── SecurityOverview.jsx# Live SOC Dashboard & Metrics
│       │   ├── UserRiskProfile.jsx # Deep Entity Behavioral Profiler
│       │   └── ...
│       └── services/api.js     # Axios API layer
├── SecureBank/                 # Protected victim banking web application
│   ├── backend/                # SecureBank FastAPI server (port 8001)
│   └── frontend/               # SecureBank React portal (port 5174)
├── docs/                       # Hackathon presentation deck, scripts & Q&A
│   ├── DEMO_SCRIPT_3MIN.md     # Word-for-word 3-minute judge script
│   ├── JUDGE_QA_PREPARATION.md # Technical defense guide for judges
│   └── PRESENTATION_SLIDES.md  # 12-slide pitch presentation
├── tests/
│   └── run_all_tests.py        # End-to-end integration test suite
├── start_demo.bat              # One-click demo launcher
├── .env.example                # Hardened environment template
└── README.md                   # Project documentation
```

---

## 🔒 Security & DevSecOps Considerations
- **Zero Hardcoded Secrets:** All cryptographic keys and JWT tokens leverage environment variables with secure fallbacks.
- **Fail-Safe Operation:** Configurable `STRICT_SECURITY_MODE` allows flexible fail-open / fail-closed posture.
- **Rate-Limiting & Memory Safety:** Parameterized ORM queries prevent SQL injection, and strict input schema validation prevents prototype pollution.

---

## 📜 Hackathon Disclaimer
*This system is an application-layer cybersecurity prototype designed for demonstration and research purposes. All attack simulation modules operate strictly against the local mock environment (`localhost`).*
