# ⏱️ 3-Minute Hackathon Demo Script for Judges

**Objective:** Deliver an unforgettable, crisp, live demonstration showing how ShadowNet AI protects a victim banking system against live cyber attacks.

---

### Minute 0:00 – 0:45 | The Hook & Architecture (The "Why")
- **Presenter:**  
  *"Good morning judges! Traditional login forms ask one question: 'Is the password correct?' But credential stuffing and leaked databases make passwords easy to obtain. ShadowNet AI asks the critical question: 'Is the login behavior trustworthy?'"*
- **Action on Screen:**  
  - Show **SecureBank Portal** (`http://localhost:5174`) in Tab 1.
  - Show **ShadowNet AI Security Dashboard** (`http://localhost:5173`) in Tab 2.
- **Key Talking Point:**  
  *"Here on the left is SecureBank, our mock enterprise banking portal. On the right is ShadowNet AI, our real-time behavioral defense and SOC platform."*

---

### Minute 0:45 – 1:30 | Demonstration of Normal vs. Attack (The "How")
- **Step 1: Normal Login**  
  - In SecureBank or Demo Center, click **Step 1: Normal Login**.
  - Log in with `demo_user` / `password123`.
  - **Screen:** SecureBank grants access smoothly. Dashboard shows 0 Risk Score (Allowed).
  - **Talking Point:** *"For legitimate employees, the system is frictionless. Zero delays."*

- **Step 2: Impossible Travel & Account Takeover**  
  - In Demo Center (`http://localhost:5173/demo`), navigate to **Judge 3-Minute Story Mode** and click **Step 4: Simulate Impossible Travel**.
  - **Screen:** 1 second after logging in from New York, a login attempt arrives from Moscow, Russia.
  - **Talking Point:** *"Notice what happens when an attacker uses the correct password from a Russian proxy 1 second later. Even with valid credentials, ShadowNet intercepts the request because the velocity exceeds physical travel capability."*

---

### Minute 1:30 – 2:15 | Explainable AI & Brute Force Lockout (The "Secret Sauce")
- **Step 3: Brute Force Password Spray**  
  - In Demo Center, click **Step 2: Launch Brute-Force Attack**.
  - The script fires rapid failed attempts.
  - **Screen:** Look at the **Live Monitor** or **Incidents** tab. Account is automatically locked, and the threat is classified as `BRUTE_FORCE`.
  - Click on the Incident in the **Incidents Center**.
- **Talking Point:**  
  *"This is where ShadowNet shines: Explainable AI. Instead of a vague block, the SOC analyst sees the exact mathematical breakdown: +45 for consecutive failed attempts, +35 for velocity burst, and +15 for unrecognized device."*

---

### Minute 2:15 – 3:00 | Incident Response & Conclusion (The "Impact")
- **Step 4: Analyst Remediation**  
  - In the Incident Response Drawer, click **Unlock Account** or **Resolve Incident**.
  - Navigate to **User Risk Profile** (`/user-risk`) and show `USR001`'s behavioral baseline (active login window, verified devices, and historical risk timeline).
- **Presenter Closing:**  
  *"In less than 3 minutes, you saw ShadowNet AI detect credential anomalies, explain its reasoning transparently, and automatically enforce protection without human lag. Thank you, and we welcome your questions!"*
