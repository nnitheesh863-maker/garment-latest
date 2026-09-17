# Couture Intelligence — Playwright Enterprise E2E Audit Plan

## 1. Executive Summary & Objective
This audit plan establishes rigorous, automated end-to-end verification across the entire Couture Intelligence platform (Industry 4.0 MES + ERP), ensuring all workflows operate on real MongoDB data, bi-directional WebSockets, multi-tier AI/ML services, and strict role-based access control (RBAC).

---

## 2. Test Architecture & Environment Matrix

| Layer | Technology | Address / Port | Role / Verification Scope |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, MUI 5, Framer Motion | `http://localhost:3000` | UI views, animations, real-time reactive state |
| **Backend** | Node.js, Express, Mongoose, Socket.IO | `http://localhost:5000` | REST API, WebSocket broadcasts, RBAC middleware |
| **Database** | MongoDB v7.0 | `mongodb://127.0.0.1:27017` | Persistent collections (Orders, Tasks, AuditLogs, etc.) |
| **ML Engine** | Python Flask, Scikit-Learn | `http://localhost:5001` | Delay and failure prediction models |
| **Test Runner** | Playwright Test (Chromium) | Headless / Headed | Automated multi-role user flows & API assertions |

---

## 3. Test Suites Structure

1. **`01-auth.spec.js`**: Admin, Manager, and Employee login lifecycle, session persistence, unauthorized route redirection, and invalid credential handling.
2. **`02-admin.spec.js`**: Command Center KPI aggregation, real-time live queues, and live Audit Log viewing.
3. **`03-manager.spec.js`**: 14-day production historical metrics, live Task Management, Order Management with search/filters, and Machine IoT telemetry.
4. **`04-employee.spec.js`**: Shopfloor task queue, attendance widget, and task progress logging.
5. **`05-realtime.spec.js`**: Socket.IO bi-directional communication channels and heartbeat probes.
6. **`06-quality.spec.js`**: Quality Control inspection review, defect recording, and rework state transitions.
7. **`07-inventory.spec.js`**: Warehouse stock levels, low-stock alerts, and automated reservation verification.
8. **`08-ai.spec.js`**: Hybrid AI architecture verification (Local Python ML -> Groq Llama-3 -> Heuristic fallback) and `GET /api/ai/ml-health`.
9. **`09-audit.spec.js`**: Real-time immutable enterprise audit trail with action filtering and timestamp verification.
10. **`10-complete-workflow.spec.js`**: Master 3-role multi-browser context test executing the complete order -> planning -> task execution -> QC approval -> machine release lifecycle.
