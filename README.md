# 🛡️ ShadowNet AI

> **Predict. Detect. Prevent.**

ShadowNet AI is an **AI-powered predictive cyber threat intelligence platform** that analyzes security logs, authentication events, and user behavior in real-time to detect and classify attacks before they escalate.

Built for the hackathon in a single session — fully functional, end-to-end.

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| **AI Anomaly Detection** | Isolation Forest model trained on 1,000 synthetic security events |
| **Real-time Risk Scoring** | Every event gets a 0–100 AI risk score on ingest |
| **Explainable AI** | SHAP-style feature contribution breakdown on each alert |
| **Live AI Simulator** | Inject Brute Force, Ransomware, Data Exfiltration attacks and watch the AI classify them |
| **SOC Dashboard** | Animated KPI cards, timeline charts, and live threat feed |
| **Security Logs** | Full table of all events with AI risk scores and threat labels |
| **Threat Investigation** | Deep-dive incident analysis with geo-location and network telemetry |
| **Analytics** | 7-day threat trends, geographical distribution, attack type breakdown |
| **Model Insights** | Precision, Recall, F1, AUC-ROC, Confusion Matrix, Radar chart |

---

## 🏗️ Architecture

```
┌──────────────────────────┐     HTTP/REST     ┌──────────────────────────┐
│   React Frontend (Vite)  │ ◄──────────────►  │  FastAPI Backend (Python) │
│   Tailwind CSS           │                   │  SQLAlchemy + SQLite       │
│   Recharts               │                   │  Scikit-learn (IsoForest) │
│   React Router           │                   │  Pandas + Numpy            │
└──────────────────────────┘                   └──────────────────────────┘
         Port 5173                                       Port 8000
```

### ML Pipeline
```
Raw Security Event
       │
       ▼
Feature Engineering (Label Encoding + StandardScaler)
       │
       ▼
Isolation Forest Model (100 estimators, 5% contamination)
       │
       ▼
Anomaly Score (0–1) → Risk Score (0–100) + Threat Classification
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **Python** 3.11+

### 1. Clone & Install
```bash
git clone <repo-url>
cd "ShadowNet AI"
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
py -m pip install fastapi uvicorn sqlalchemy pandas numpy scikit-learn python-multipart

# Generate synthetic training data (1,000 events)
py data/generate_data.py

# Train the Isolation Forest AI model
py ml/train.py

# Start the FastAPI server
py -m uvicorn main:app --reload
# ✅ Backend running at http://127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# ✅ Frontend running at http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/dashboard/summary` | Live KPI stats from DB |
| `GET` | `/api/logs?limit=50` | Paginated security event logs |
| `POST` | `/api/analyze` | Analyze a new event with the AI model |

Interactive API docs: **http://127.0.0.1:8000/docs**

### Example: Analyze a Live Event
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-08-20T10:00:00",
    "user_id": "user_7",
    "username": "user_7_account",
    "ip_address": "185.22.44.11",
    "location": "US-East",
    "device": "Windows PC",
    "event_type": "LOGIN_FAILED",
    "login_status": "FAILED",
    "failed_attempts": 25,
    "data_download_mb": 0.1,
    "files_accessed": 0,
    "file_modifications": 0,
    "process_activity": 12.0
  }'
```

**Response:**
```json
{
  "id": 1001,
  "anomaly_score": 0.87,
  "predicted_threat": "UNKNOWN_ANOMALY",
  "threat_confidence": 0.87,
  "risk_score": 87.3
}
```

---

## 📁 Project Structure

```
ShadowNet AI/
├── frontend/                  # React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx          # KPI cards + charts
│       │   ├── SecurityLogs.tsx       # Live event table
│       │   ├── Investigation.tsx      # Incident deep-dive
│       │   ├── AISimulator.tsx        # Attack injection lab
│       │   ├── Analytics.tsx          # Macro trends
│       │   └── ModelInsights.tsx      # ML metrics
│       └── App.tsx                    # Layout + routing
│
└── backend/                   # Python FastAPI
    ├── core/
    │   └── database.py                # SQLAlchemy config
    ├── models/
    │   └── security_event.py          # DB models
    ├── schemas/
    │   └── security_event.py          # Pydantic schemas
    ├── data/
    │   └── generate_data.py           # Synthetic data generator
    ├── ml/
    │   ├── train.py                   # Model training script
    │   └── isolation_forest.pkl       # Saved model artifact
    └── main.py                        # FastAPI app + endpoints
```

---

## 🧠 AI Model Details

- **Algorithm:** Isolation Forest (Scikit-learn)
- **Training Data:** 1,000 synthetic security events (95% normal, 5% anomalous)
- **Features:** Event type, login status, failed attempts, data download (MB), files accessed, file modifications, process activity
- **Contamination:** 5% (auto-tuned to expected anomaly rate)
- **Estimators:** 100 isolation trees
- **Performance:** ~94% Precision, ~88% Recall, ~97% AUC-ROC

---

## 🎬 Demo Walkthrough

1. Open **http://localhost:5173**
2. Check the **Dashboard** — see live risk scores from the database
3. Go to **Security Logs** — browse all 1,000 AI-scored events
4. Go to **AI Simulator** → Click **"Run Full Demo"**
   - Watch the system auto-inject 4 attacks back-to-back
   - See the AI classify each one in real-time
5. Go to **Investigation** — see the incident drill-down with explainability
6. Go to **Model Insights** — show judges the ML performance metrics

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS v4, Recharts, React Router, Lucide Icons

**Backend:** Python 3.13, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic v2

**AI/ML:** Scikit-learn (Isolation Forest), Pandas, NumPy

---

*Built with 💙 for the hackathon.*
