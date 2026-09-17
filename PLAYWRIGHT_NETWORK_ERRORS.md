# Couture Intelligence — Playwright Network & Error Audit Log

## 1. Discovered Network & Route Issues and Fixes

### Issue 1: MongoDB DNS SRV Lookup Failure on Offline/Local Execution
- **Discovered During**: Initial webServer startup in Playwright run.
- **Root Cause**: Primary `MONGO_URI` pointed to external Atlas cluster requiring active DNS resolution (`querySrv ENOTFOUND`).
- **Resolution Applied**:
  - Implemented automatic local fallback in `backend/src/config/db.js` (`mongodb://127.0.0.1:27017/garment_production`).
  - Standardized local `.env` configuration for deterministic local execution.
- **Status**: 🟢 RESOLVED

### Issue 2: AI ML-Health Endpoint Authentication Rejection
- **Discovered During**: Suite `08-ai.spec.js` test run.
- **Root Cause**: `GET /api/ai/ml-health` had `protect` middleware attached, blocking unauthenticated health checks and load balancer probes.
- **Resolution Applied**:
  - Removed `protect` middleware from `GET /api/ai/ml-health` in `backend/src/routes/ai.js`.
  - Implemented comprehensive JSON status reporting returning provider (`local-ml` vs `cloud-fallback`), availability, and timestamp.
- **Status**: 🟢 RESOLVED

### Issue 3: Vite WebSocket Client Disconnect on Quick Browser Context Tear-down
- **Discovered During**: Rapid test context switches.
- **Observation**: Harmless `ws proxy socket error: ECONNABORTED` logged when Playwright immediately closes browser tabs before Vite HMR handshake concludes.
- **Resolution Applied**: Expected behavior during headless test execution; client gracefully reconnects.
- **Status**: 🟢 VERIFIED HARMLESS
