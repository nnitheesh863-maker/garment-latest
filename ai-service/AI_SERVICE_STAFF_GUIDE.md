# 🧵 Garment Manufacturing AI Service — Staff Architecture & Technical Guide

Welcome to the **Garment Manufacturing AI Service** documentation. This guide was prepared so that you and your team (engineers, floor managers, data analysts, and executives) have a crystal-clear understanding of how our Artificial Intelligence microservice works, the algorithms powering it, and the business value it provides to the factory floor.

---

## 📌 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [System Architecture & Data Flow](#2-system-architecture--data-flow)
3. [The 4 Core AI Engines Explained](#3-the-4-core-ai-engines-explained)
   - [Engine 1: Production Output Forecast](#engine-1-production-output-forecast)
   - [Engine 2: Order Delay Risk Prediction](#engine-2-order-delay-risk-prediction)
   - [Engine 3: Machine Failure & Predictive Maintenance](#engine-3-machine-failure--predictive-maintenance)
   - [Engine 4: Workforce Analytics & Skill Gap Engine](#engine-4-workforce-analytics--skill-gap-engine)
4. [Performance, Caching & Automated Retraining](#4-performance-caching--automated-retraining)
5. [API Reference & Sample Payloads](#5-api-reference--sample-payloads)
6. [Staff FAQ & Presentation Q&A](#6-staff-faq--presentation-qa)

---

## 1. Executive Summary & Purpose

Our AI Service is a **Python/Flask microservice** that acts as the factory's intelligent decision-support system. It transforms raw operational data (order queues, IoT machine sensor readings, line worker performance logs) into:
- **Accurate production output forecasts** with statistical confidence bounds.
- **Early warnings for order delivery delays** before they disrupt customers.
- **Predictive maintenance alerts** to prevent costly machine breakdowns during peak shifts.
- **Objective workforce performance evaluations** and automated training recommendations.

```
       ┌────────────────────────────────────────────────────────────┐
       │                   Garment Factory Operations               │
       └─────────────────────────────┬──────────────────────────────┘
                                     │
                        Raw Telemetry & Order Data
                                     ▼
       ┌────────────────────────────────────────────────────────────┐
       │              Python / Flask AI Microservice                │
       ├─────────────────┬──────────────────┬───────────────────────┤
       │ 1. Production   │ 2. Delay Risk    │ 3. Machine            │ 4. Workforce   │
       │    Forecast     │    Prediction    │    Maintenance        │    Analytics   │
       │  (RandomForest) │  (RandomForest)  │   (RandomForest)      │  (Multi-Weight)│
       └─────────────────┴──────────────────┴───────────────────────┘
                                     │
                   Prescriptive Insights & Mitigations
                                     ▼
       ┌────────────────────────────────────────────────────────────┐
       │       Executive Dashboard & Floor Manager Action Items     │
       └────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture & Data Flow

The AI Service operates alongside our Node.js/Express backend and React frontend:

```
[ React / Vite Frontend ] ──(REST)──▶ [ Node.js Backend ] ──(REST)──▶ [ Python AI Microservice ]
                                               │                                   │
                                               ▼                                   ▼
                                       [ MongoDB Database ]             [ Saved Model Binaries ]
                                                                        (.joblib serialized models)
```

### Folder Structure Overview
```text
ai-service/
├── app.py                      # Flask API routes, CORS, error handling & startup bootstrapping
├── config.py                   # Centralized configuration (ports, logging, model paths, TTL)
├── models/
│   ├── production_forecast.py  # Output prediction model (Random Forest Regression)
│   ├── delay_prediction.py     # Order bottleneck classifier (Random Forest Classifier)
│   ├── failure_prediction.py   # Machine sensor predictive maintenance model
│   └── performance_analysis.py # Multi-criteria weighted workforce scoring engine
├── services/
│   ├── prediction_service.py   # Orchestration layer + LRU/TTL caching + aggregated insights
│   └── training_service.py     # Asynchronous training pipelines & 24h background daemon
├── utils/
│   └── preprocessor.py         # Missing value imputation, feature engineering & scaling
├── Dockerfile                  # Container build definition
└── requirements.txt            # Python dependencies (scikit-learn, pandas, numpy, flask)
```

---

## 3. The 4 Core AI Engines Explained

### Engine 1: Production Output Forecast
* **File:** `models/production_forecast.py`
* **Algorithm:** **Random Forest Regressor** (200 ensemble trees, max depth 20)
* **Goal:** Forecasts the total piece volume the factory will manufacture on a given day.

#### How It Works:
1. **Inputs:** Order volume, employee count, active machine count, day of week, month, order priority, and capacity utilization.
2. **Feature Extraction:** Breaks dates into temporal markers (e.g. weekend penalty, month seasonality) and calculates factory capacity utilization ratio.
3. **Point Prediction & 95% Confidence Interval ($CI$):**
   The model passes input features through all 200 trees. The mean across trees gives the point prediction $\hat{y}$. The standard deviation across trees $\sigma_{\text{trees}}$ is used to calculate the 95% confidence interval:
   $$\text{Lower Bound} = \max(0, \hat{y} - 1.96 \cdot \sigma_{\text{trees}})$$
   $$\text{Upper Bound} = \hat{y} + 1.96 \cdot \sigma_{\text{trees}}$$
4. **Evaluation Metrics:**
   - **$R^2$ Score:** Measures variance explained (Target: $> 0.85$).
   - **MAE (Mean Absolute Error):** Average difference in piece count between predicted and actual.
   - **RMSE (Root Mean Squared Error):** Penalizes larger forecasting errors.

---

### Engine 2: Order Delay Risk Prediction
* **File:** `models/delay_prediction.py`
* **Algorithm:** **Random Forest Classifier** (Balanced class weighting)
* **Goal:** Identifies whether a new order is at risk of missing its delivery deadline.

#### How It Works:
1. **Inputs:** Order complexity (1–10), line operator average experience (years), machine health score (0–1), fabric/trim availability (0–1), and current factory workload percentage.
2. **Classification Output:** Delay Probability ($0\%$ to $100\%$).
3. **Risk Severity Tiers:**
   - 🟢 **Low Risk:** $< 30\%$
   - 🟡 **Medium Risk:** $30\% - 60\%$
   - 🔴 **High Risk:** $> 60\%$
4. **Root Cause Analysis & Prescriptive Action:**
   The engine automatically detects the root bottleneck and suggests solutions:
   - *High Complexity?* ➡️ "Assign master stitchers to critical assembly stages."
   - *Machine Health Low?* ➡️ "Dispatch mechanic for preventive maintenance."
   - *Material Shortage?* ➡️ "Expedite secondary fabric supplier order."

---

### Engine 3: Machine Failure & Predictive Maintenance
* **File:** `models/failure_prediction.py`
* **Algorithm:** **Random Forest Classifier** (Physics-assisted telemetry classification)
* **Goal:** Prevents machine breakdowns by alerting maintenance staff before a failure occurs.

#### How It Works:
1. **Inputs:** Temperature (°C), Vibration level (RMS), Stitch speed (RPM), Power usage (Watts), Operating hours since last service, and Machine age.
2. **Threshold Violation Detection:**
   - Temperature $> 80^\circ\text{C}$
   - Vibration $> 0.70$ index
   - Power Usage $> 90\text{ W}$
   - Operating Hours $> 500\text{ hrs}$ since maintenance
3. **Time-To-Failure (TTF) Calculation:**
   Estimates remaining operating hours before breakdown:
   $$\text{TTF (Hours)} = 8760 \cdot \left(1 - \frac{p_{\text{failure}}}{100}\right) \cdot \left(\frac{1}{1 + \text{Vibration}}\right) \cdot \left(\frac{100}{\text{Temperature} + 1}\right)$$
4. **Risk Levels:** `Critical` ($>70\%$), `High` ($>40\%$), `Medium` ($>20\%$), `Low` ($\le 20\%$).

---

### Engine 4: Workforce Analytics & Skill Gap Engine
* **File:** `models/performance_analysis.py`
* **Algorithm:** **Multi-Criteria Weighted Rule Engine & Set Operations**
* **Goal:** Provides fair, transparent worker evaluations and pinpoints upskilling needs.

#### Scoring Formula:
$$\text{Overall Score} = (0.30 \times \text{Productivity}) + (0.30 \times \text{Quality}) + (0.25 \times \text{Efficiency}) + (0.15 \times \text{Attendance})$$

| Metric | Calculation | Business Objective |
| :--- | :--- | :--- |
| **Productivity (30%)** | $\frac{\text{Completed Tasks}}{\text{Assigned Tasks}} \times 100$ | Ensuring daily output quotas are met |
| **Quality Score (30%)** | $\left(1 - \frac{\text{Defects}}{\text{Total Garments}}\right) \times 100$ | Preventing defective garments from reaching shipping |
| **Efficiency (25%)** | $\frac{\text{Standard Allowed Minutes (SAM)}}{\text{Actual Minutes}} \times 100$ | Rewarding fast, standardized motion |
| **Attendance (15%)** | Recorded shift attendance % | Minimizing line disruption from absenteeism |

#### Skill Gap Detection:
$$\text{Skill Gaps} = \text{Required Line Skills} \setminus \text{Employee Certified Skills}$$
If an operator lacks a skill required for a new jacket or collar operation, the system automatically flags the specific training program needed.

---

## 4. Performance, Caching & Automated Retraining

### In-Memory Thread-Safe TTL Cache
To ensure ultra-fast response times ($< 10\text{ ms}$), predictions are cached in a thread-safe **Least Recently Used (LRU) Cache** with a 300-second Time-To-Live (`CACHE_TTL_SECONDS=300`). Identical queries return immediately without re-running model inference.

### Automatic 24-Hour Retraining Daemon
A background daemon thread wakes up every 24 hours (`RETRAIN_INTERVAL_HOURS=24`) to retrain all models on newly logged factory data, recalculate accuracy metrics ($R^2$, AUC-ROC), and save updated `.joblib` binary files to disk.

---

## 5. API Reference & Sample Payloads

### Base URL: `http://localhost:5001`

#### 1. Unified Prediction — `POST /api/predict`
```json
{
  "type": "production",
  "data": {
    "order_date": "2026-09-20",
    "employee_count": 65,
    "machine_count": 25,
    "order_volume": 2500,
    "order_priority": "high"
  }
}
```
**Sample Response:**
```json
{
  "success": true,
  "result": {
    "forecast": {
      "predicted_quantity": 2420.5,
      "confidence_interval": {
        "lower": 2280.0,
        "upper": 2561.0
      },
      "trend_direction": "stable",
      "confidence_score": 0.94
    },
    "model_version": "1.0.0",
    "model_accuracy": {
      "r2_score": 0.912,
      "mae": 45.2,
      "rmse": 62.1
    }
  }
}
```

#### 2. Cross-Factory Aggregate Analysis — `POST /api/analyze`
Accepts `production`, `orders`, `employees`, and `machines` in a single request and returns a complete executive dashboard summary with priority recommendations.

#### 3. Health Probe — `GET /api/health`
Returns microservice operational status, model versions, and readiness.

---

## 6. Staff FAQ & Presentation Q&A

### Q1: "Why use Random Forest instead of a Deep Learning neural network?"
> **Answer:** Random Forest provides excellent accuracy on structured tabular factory data without requiring millions of data points. It is resilient against outliers, does not overfit easily, and crucially, gives us **feature importance rankings** so we can explain *why* an order is delayed or *why* a machine is predicted to fail.

### Q2: "What happens if a sensor disconnects or an input field is missing?"
> **Answer:** Our preprocessing module (`utils/preprocessor.py`) includes defensive imputation. Numeric missing values default to historical line averages, categorical fields default to standard modes, and missing sensors default to safe baseline values to prevent service crashes.

### Q3: "How does the system ensure worker evaluations are fair?"
> **Answer:** Evaluations are based on transparent, objective metrics: 30% productivity, 30% quality (defect-free work), 25% efficiency (SAM compliance), and 15% attendance. It removes supervisor bias and directly pairs low scores with targeted coaching opportunities rather than punitive measures.

### Q4: "How does Predictive Maintenance save factory operating costs?"
> **Answer:** Unplanned machine downtime during a production shift can idle an entire assembly line, resulting in thousands of dollars in lost labor and delayed shipments. By monitoring vibration, temperature, and operating hours, the AI alerts mechanics to replace worn belts or bearings during scheduled downtime before catastrophic breakdown occurs.

---
*Guide maintained by Garment Engineering Team. Version 1.0.0.*
