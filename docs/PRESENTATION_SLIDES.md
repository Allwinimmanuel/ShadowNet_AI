# ShadowNet AI — Hackathon Grand Finale Presentation Slides

**Project Title:** ShadowNet AI — Real-Time AI-Powered Adaptive Login Defense & Behavioral Threat Prevention  
**Team Name / Hackathon Track:** Cybersecurity, Artificial Intelligence & DevSecOps  

---

## 📽️ Slide Deck Overview (12 Slides)

### Slide 1: Title & Tagline
- **Title:** ShadowNet AI
- **Subtitle:** *“Traditional authentication asks if the password is correct. ShadowNet AI asks if the login behavior is trustworthy.”*
- **Visual:** Split screen showing conventional static login form vs. ShadowNet's multi-signal neural SOC radar.
- **Presenter Hook:** *"Every day, billions of stolen credentials are tested against online banking systems. But 80% of breaches happen not with stolen passwords, but with normal credentials used in malicious contexts."*

---

### Slide 2: The Core Problem
- **The Blind Spot:** Standard authentication systems perform binary credential validation: `Input == Hash`.
- **Attack Reality:**
  1. Credential Stuffing bots test millions of valid credentials leaked from dark web databases.
  2. Brute-Force Password Spraying overwhelms rate limits.
  3. Account Takeover occurs when legitimate credentials are used from foreign Tor exit nodes at 3:00 AM.
- **Cost:** Financial fraud, identity theft, and SOC alert fatigue.

---

### Slide 3: The ShadowNet AI Solution
- **Adaptive Login Defense:** An intelligent security middleware positioned between the client application and authentication backend.
- **Zero-Friction for Humans:** Legitimate users pass through seamlessly with 0 Risk Score.
- **Instant Block for Attackers:** Multi-signal behavioral heuristics + Machine Learning classify anomalies and enforce microsecond mitigation before the account is compromised.

---

### Slide 4: System Architecture
```
  [ Attacker / Legitimate User ]
                 │
                 ▼
     [ Target App: SecureBank ]
                 │ (Context: IP, Device, Time, Geo, Velocity)
                 ▼
      [ ShadowNet Security Gateway ]
   ┌─────────────┼─────────────┬─────────────┐
   ▼             ▼             ▼             ▼
[RandomForest] [Rule Engine] [UEBA Engine] [Threat Intel]
   └─────────────┼─────────────┴─────────────┘
                 ▼
      [ Multi-Signal Risk Fusion ]
                 │ (0 – 100 Calibrated Score)
                 ▼
     [ Explainable AI (XAI) Layer ]
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  [ ALLOW ]  [ CHALLENGE ] [ BLOCK / LOCK ]
                 │
                 ▼
  [ Real-Time SOC Operations Dashboard ]
```

---

### Slide 5: The AI & Risk Fusion Engine
- **Random Forest Classifier:** Trained on synthetic behavioral login telemetry (velocity, device novelty, location jump, time delta, failed attempts).
- **UEBA (User & Entity Behavior Analytics):** Continuous dynamic baseline per user identity (typical login hours, habitual locations, verified device fingerprints).
- **Deterministic Rules:** Hard safety limits (5 failures = Account Lock, 10 requests/min = IP Block).
- **Threat Intelligence:** High-risk IP reputation, Tor exit node feeds, and Impossible Travel velocity verification (e.g. 7,500 km in 3 seconds).

---

### Slide 6: Explainable AI (XAI) — The Key Differentiator
- **The Black-Box Problem:** Security analysts hate black-box AI blocks because they cannot answer *“Why was this blocked?”*
- **ShadowNet's Solution:** Full additive mathematical transparency:
  - `Total Risk: 92/100`
  - `+35 Impossible Travel: New York to Moscow jump in 2 seconds`
  - `+20 Unfamiliar Device: Kali-Linux / Headless Tor Browser`
  - `+25 Failed Attempts: 4 sequential password mismatches`
  - `+12 Off-Hours: Access at 03:00 AM (User baseline: 09:00–18:00)`

---

### Slide 7: Integrated Victim Application — SecureBank
- **Real-World Demonstration:** A fully functional online banking application (**SecureBank** on port 5174).
- **Zero Disruption Integration:** SecureBank forwards login context via a lightweight 5-line middleware call to ShadowNet AI.
- **Adaptive Outcomes:** Seamless login, Step-Up Verification (MFA), or Account Lockout directly reflected in the banking UI.

---

### Slide 8: The Attack Simulator & Scenario Suite
- **9 Live Local Attack Vectors:**
  1. Normal Trusted Login
  2. Brute-Force Password Spraying
  3. Credential Stuffing
  4. Account Takeover via Tor
  5. Impossible Travel (7,500 km jump)
  6. Unrecognized Device / Smart TV
  7. Volumetric Rate Flooding
  8. Flagged Russian Botnet Proxy
  9. Scripted Bot / Non-Browser Fingerprint

---

### Slide 9: The Security Operations Center (SOC)
- **Live Monitoring:** Real-time stream of all authentication events across the infrastructure.
- **Incident Response Center:** One-click analyst triage, investigation status, account unlocking, and IP unblocking.
- **Entity Risk Profiler:** Deep inspection of individual user behavioral habit deviations.

---

### Slide 10: Technical Highlights & DevSecOps
- **FastAPI Backend:** Microsecond inference latency (< 15ms).
- **Secure by Design:** Zero hardcoded secrets, HMAC-SHA256 JWT auth, parameterized SQLite/SQLAlchemy queries, clean separation of concerns.
- **Comprehensive Test Suite:** 100% passing test coverage covering unit and end-to-end integration scenarios.

---

### Slide 11: Limitations & Honesty in AI
- **Synthetic Baseline:** Current model trained on curated synthetic telemetry; production deployment requires enterprise-scale telemetry pipelines.
- **Layer 7 Focus:** Application-layer login protection; works in synergy with, not as a replacement for, network-layer WAFs and DDoS scrubbers.
- **Dynamic IP Churn:** Users on mobile networks may trigger minor geo deviations, handled gracefully by step-up challenges rather than permanent blocks.

---

### Slide 12: Future Roadmap & Conclusion
- **Phase 1 (Achieved):** Real-time adaptive ML login protection, XAI reasoning, SOC dashboard, and SecureBank integration.
- **Phase 2:** FIDO2 / WebAuthn passwordless biometric step-up integration.
- **Phase 3:** Graph Neural Networks (GNNs) for detecting distributed botnet clusters across multiple enterprise tenants.
- **Closing Statement:** *“ShadowNet AI turns authentication from a static checkpoint into a dynamic, intelligent shield.”*
