# 🚀 SafeGig / ClaimSwift  
### AI-Powered Parametric Insurance for Gig Workers  

---

## 👤 Who Is Our User?

Our primary user is a **gig delivery worker**:

- Works on platforms like Blinkit, Zepto, Swiggy  
- Earns daily income (~₹800–₹2000/day)  
- Depends entirely on continuous order flow  
- Has no financial protection during disruptions  

### 🧩 Real Problem

If heavy rain or platform outages occur:
- Orders drop to zero  
- Daily income becomes ₹0  
- No fallback or insurance exists  

Even one disrupted day can cause real financial stress.

---

## 🧠 Problem Statement

Gig workers face **unpredictable income loss** due to:

- Weather disruptions (rain, floods)  
- Platform outages  
- Zone-level demand crashes  

Traditional insurance fails because:
- Claims are slow and manual  
- Not designed for real-time gig work  
- Requires verification delays  

---

## 💡 Our Solution

SafeGig is an **AI-powered parametric insurance platform** that:

- Detects disruptions using real-time signals  
- Calculates risk using AI  
- Automatically triggers payouts  

If disruption is detected → payout is instant.

---

## ⚙️ How the System Works

### End-to-End Flow

Worker Activity + External Signals  
→ Backend API (Node.js)  
→ AI Risk Engine (Python)  
→ Risk Score (0–1)  
→ Threshold Check  
→ Automatic Claim Trigger  
→ Wallet Credit  

---

## 🧠 How Our AI Actually Works

We use a **weighted risk scoring model (Phase 1)**.

### Input Signals:
- Rainfall intensity  
- Delivery drop percentage  
- Worker-generated reports  

### Risk Formula:

risk_score = (0.4 × rainfall) + (0.3 × delivery_drop) + (0.3 × reports)

- Output range: 0.0 to 1.0  
- Higher score = higher disruption  

### Decision Logic:
- If risk_score exceeds threshold → trigger payouts  
- Threshold can vary by zone  

### Why This Works:
- Combines environmental + behavioral signals  
- Reduces dependency on one data source  
- Enables real-time automated decisions  

---

## 🏗️ System Architecture (How It Is Built)

### Frontend
- HTML, CSS, JavaScript  
- Dashboard, Simulation UI, Analytics  

### Backend (Node.js + Express)
- Authentication APIs  
- Policy generation  
- Wallet system  
- AI integration  

### AI Layer (Python)
- Risk scoring engine  
- Receives signals and returns risk score  

### Database (Optional Firebase)
- Stores users, policies, transactions  

---

## 🧪 What We Built (Seed Phase)

- Authentication system (Login/Signup)  
- AI-based policy generation  
- Payment and policy activation flow  
- Wallet with automated payouts  
- Simulation engine (live disruption demo)  
- Analytics dashboard  

---

## 🔥 Core Innovation

### Parametric Insurance Engine

Instead of manual claims:
- System uses data thresholds  
- Automatically triggers payouts  
- No paperwork or verification delays  

---

## 🛡️ Adversarial Defense & Anti-Spoofing Strategy

### 🚨 Market Crash Scenario

Fraud groups can exploit the system using GPS spoofing:
- Fake location in high-risk zones  
- Trigger false claims  
- Drain liquidity pool  

---

### 🧠 1. Differentiation: Real vs Fake Worker

We do not rely only on GPS.

We analyze:
- Movement continuity (real travel vs sudden jumps)  
- Delivery activity (active vs inactive)  
- Time spent in zone  
- Historical behavior patterns  

Fraud users show inconsistent behavior patterns.

---

### 📊 2. Data Signals Beyond GPS

We include:

- Delivery completion rate  
- Order acceptance/drop patterns  
- Historical route tracking  
- Network latency and signal stability  
- Device fingerprinting  
- Cluster behavior (multiple users spoofing together)  

---

### 🛡️ 3. Fraud Detection Layer

Before payout, data goes through:

User Data → Behavior Analysis → Anomaly Detection → Risk Validation  

System flags:
- Identical location clusters  
- No delivery activity but high claims  
- Repeated suspicious patterns  

Only validated signals trigger payouts.

---

### ⚖️ 4. UX Balance (Fairness)

To avoid harming genuine workers:

- Suspicious claims are flagged, not rejected  
- Partial payouts possible  
- Delayed verification instead of blocking  
- Transparent status shown in dashboard  

---

### 🔁 5. Improved System Flow

Old System:  
GPS → Risk → Payout  

Improved System:  
Multi-signal data → Fraud Detection → AI Risk Engine → Smart Payout  

---

### 🎯 Outcome

- Prevents coordinated fraud attacks  
- Protects liquidity pool  
- Maintains fairness for genuine workers  
- Builds trust in the system  

---

## 🚀 Future Plans

### AI Improvements
- Machine learning models (time-series prediction)  
- Advanced anomaly detection  

### Data Integration
- Real-time weather APIs  
- Integration with gig platforms  

### Security
- Behavioral biometrics  
- Anti-collusion detection  

---

## 🎯 Vision

To build the **fastest, smartest, and fairest income protection system for gig workers**.

---

## ⚡ How to Run

1. Start backend:
node server.js  

2. Open frontend:
index.html  

3. Flow:
Signup → Login → Generate Policy → Simulate → Dashboard  

---  
