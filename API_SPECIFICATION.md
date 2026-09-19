# Garment ERP REST API Specification

Comprehensive documentation of all backend microservice endpoints, authentication schemes, request parameters, and response structures.

## Authentication
All protected routes require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```

## Key Resource Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new staff account
- `POST /api/auth/login` - User login and token generation
- `GET /api/auth/me` - Retrieve current authenticated profile

### 2. Orders (`/api/orders`)
- `GET /api/orders` - List orders with status & pagination filters
- `POST /api/orders` - Create new production order
- `GET /api/orders/:id` - Get order details and timeline
- `PATCH /api/orders/:id/status` - Update order lifecycle status

### 3. Production Lines (`/api/production-lines`)
- `GET /api/production-lines` - Real-time line capacity and active supervisor
- `POST /api/production-lines` - Provision line configuration

### 4. Inventory (`/api/inventory`)
- `GET /api/inventory` - Materials list and stock levels
- `POST /api/inventory/reorder` - Trigger material replenishment

### 5. Quality Control & Defects (`/api/quality`, `/api/defects`)
- `GET /api/quality/metrics` - Pass rates and defect heat-maps
- `POST /api/defects` - Submit defect incident report
