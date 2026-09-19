# Garment ERP System Architecture & Design

## Overview
Garment ERP is a modern full-stack intelligent garment manufacturing and workflow execution platform.

```
+-----------------------------------------------------------+
|                      React Frontend                       |
|           (Vite, TailwindCSS, Chart.js, Lucide)          |
+-----------------------------+-----------------------------+
                              |
                     REST & WebSocket (Socket.IO)
                              |
+-----------------------------v-----------------------------+
|                     Node.js / Express                     |
|                 (API Gateway & Business Logic)            |
+--------------+------------------------------+-------------+
               |                              |
         MongoDB Database            Python AI Microservice
    (Mongoose ODM & Schemas)         (ML Forecasting Engine)
```

## Microservices Breakdown
- **Frontend**: Single-page application partitioned by roles (`Admin`, `Manager`, `Employee`).
- **Backend**: Express REST API providing RBAC, transactional database operations, and live Socket.IO events.
- **AI Microservice**: Python predictive models for equipment failure estimation and delivery delay risk analysis.
