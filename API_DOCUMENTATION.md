# Dominion Seedstars API – Frontend Integration Guide

**Base URL:**  
`http://localhost:5000/api/v1`

**Authentication:**  
Most endpoints require a Bearer token (`Authorization: Bearer <token>`). Obtain this via the login endpoint.

---

## Auth Endpoints

| Endpoint                | Method | Body/Params | Description |
|-------------------------|--------|-------------|-------------|
| `/auth/register`        | POST   | `{ username, email, password, role }` | Register a new user (admin/HO only) |
| `/auth/login`           | POST   | `{ email, password }` | Login, returns JWT token |
| `/auth/forgot-password` | POST   | `{ email }` | Request password reset |
| `/auth/reset-password/:RESET_TOKEN` | PUT | `{ password }` | Reset password with token |
| `/auth/me`              | GET    | -           | Get current user info (token required) |
| `/auth/logout`          | POST   | -           | Logout (token required) |

---

## Users

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/users`         | GET    | `?page&limit` | List users (admin/HO only) |
| `/users`         | POST   | `{ username, email, password, role, branchId }` | Create user |
| `/users/:id`     | GET    | -           | Get user by ID |
| `/users/:id`     | PUT    | `{ email, status }` | Update user |
| `/users/:id`     | DELETE | -           | Delete user |

---

## Branches

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/branches`      | GET    | -           | List branches |
| `/branches`      | POST   | `{ name, code, address, phone, email }` | Create branch |
| `/branches/:id`  | GET    | -           | Get branch by ID |
| `/branches/:id`  | PUT    | `{ phone }` | Update branch |
| `/branches/:id/toggle-status` | PATCH | `{ status }` | Activate/deactivate branch |
| `/branches/:id`  | DELETE | -           | Delete branch |

---

## Cashbook

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/cashbook`      | POST   | `{ branchId, date, cashbook1, cashbook2, ... }` | Create cashbook entry |
| `/cashbook`      | GET    | `?page&limit` | List entries |
| `/cashbook/:id`  | GET    | -           | Get entry by ID |
| `/cashbook/:branchId/:date` | GET | - | Get entry by branch and date |
| `/cashbook/:id`  | PUT    | `{ ... }`   | Update entry |
| `/cashbook/:id/status` | PATCH | `{ status }` | Update entry status |
| `/cashbook/reports/summary` | GET | `?branchId&date` | Get summary report |
| `/cashbook/:id`  | DELETE | -           | Delete entry |

---

## Reports

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/reports/financial` | GET | `?startDate&endDate&branchId` | Financial report |
| `/reports/daily` | GET | `?date` | Daily report |
| `/reports/daily/export` | GET | `?date&format=csv` | Export daily report |
| `/reports/monthly` | GET | `?month` | Monthly report |
| `/reports/monthly/export` | GET | `?month&format=csv` | Export monthly report |
| `/reports/consolidated` | GET | `?startDate&endDate` | Consolidated report |
| `/reports/consolidated/export` | GET | `?startDate&endDate&format=csv` | Export consolidated report |
| `/reports/custom` | POST | `{ from, to }` | Custom report |
| `/reports/custom/export` | GET | `?from&to&format=csv` | Export custom report |

---

## Metrics

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/metrics/online-cih-tso` | GET | `?date` | Get online CIH TSO metrics |

---

## Operations

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/operations/daily` | GET | `?date&branchId` | Get daily operations |
| `/operations/daily` | POST | `{ date, branchId, tsoData }` | Create daily operations |
| `/operations/daily/:id/submit` | PATCH | `{ submittedBy }` | Submit daily operations |
| `/operations/ho-fields` | PATCH | `{ field1, ... }` | Update HO fields |
| `/operations/history` | GET | `?page&limit` | Get operations history |

---

## Dashboard

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/dashboard/branch` | GET | `?branchId&date` | Branch dashboard |
| `/dashboard/ho` | GET | `?date` | HO dashboard |

---

## Registers

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/registers/loan` | GET | - | Get loan register |
| `/registers/savings` | GET | - | Get savings register |
| `/registers/previous` | PATCH | `{ previous }` | Update previous register values |

---

## Bank Statements

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/bank-statements/bs1` | GET | - | Get Bank Statement 1 |
| `/bank-statements/bs2` | GET | - | Get Bank Statement 2 |
| `/bank-statements/bs2/tbo` | PATCH | `{ tbo }` | Update TBO (BS2) |

---

## Prediction

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/prediction`    | GET | `?branchId&date` | Get predictions |
| `/prediction`    | POST | `{ branchId, forecast }` | Create prediction |

---

## Disbursement Roll

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/disbursement-roll` | GET | `?date` | Get disbursement roll |
| `/disbursement-roll/previous` | PATCH | `{ previous }` | Update previous disbursement |

---

## Settings

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/settings/system` | GET | - | Get system settings |
| `/settings/system` | PUT | `{ appName }` | Update system settings |
| `/settings/financial` | GET | - | Get financial settings |
| `/settings/financial` | PUT | `{ taxRate }` | Update financial settings |
| `/settings/security` | GET | - | Get security settings |
| `/settings/security` | PUT | `{ passwordMinLength }` | Update security settings |
| `/settings/notifications` | GET | - | Get notifications settings |
| `/settings/notifications` | PUT | `{ emailEnabled, smsEnabled }` | Update notifications settings |

---

## Audit

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/audit-logs`    | GET | `?page&limit` | List audit logs |

---

## System

| Endpoint         | Method | Body/Params | Description |
|------------------|--------|-------------|-------------|
| `/health`        | GET | - | Health check |
| `/permissions`   | GET | - | List permissions |
| `/system-metrics`| GET | - | System metrics (token required) |

---

**Notes:**
- All endpoints requiring authentication must include the `Authorization: Bearer <token>` header.
- Replace variables like `{{USER_ID}}`, `{{BRANCH_ID}}`, `{{ENTRY_ID}}`, and `{{RESET_TOKEN}}` with actual values.
- For POST/PUT/PATCH requests, send JSON in the request body as shown in the examples.

If you need sample request/response payloads or more details for any endpoint, let me know!
# Operations Management System API Documentation

## Overview

The Operations Management System for Dominion Seedstars Nig LTD has been fully implemented according to the PRD requirements. This system enables automated branch daily reporting and provides real-time visibility into financial and loan operations.

## System Architecture

### Roles

- **HO (Head Office)**: Oversees all branch operations, can create branches, input control fields, and view all data
- **BR (Branch)**: Manages daily operations and inputs daily financial data

### Core Modules Implemented

#### 1. Authentication & Access Control (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (sends email to HO when BR logs in)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `PUT /api/auth/reset-password/:token` - Reset password

#### 2. Branch Management (`/api/branches`)

- `GET /api/branches` - List all branches
- `POST /api/branches` - Create branch (HO only)
- `GET /api/branches/:id` - Get single branch
- `PUT /api/branches/:id` - Update branch (HO only)
- `DELETE /api/branches/:id` - Delete branch (HO only)
- `PATCH /api/branches/:id/toggle-status` - Activate/deactivate branch (HO only)

#### 3. Daily Operations (`/api/operations`)

- `GET /api/operations/daily` - Get daily operations
- `POST /api/operations/daily` - Create/update daily operations (BR only)
- `PATCH /api/operations/daily/:id/submit` - Submit daily operations (BR only)
- `PATCH /api/operations/ho-fields` - Update HO-only fields (HO only)
- `GET /api/operations/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=1&limit=20&branchId=...` - Paginated historical operations list (BR sees own branch; HO/Admin can filter by branch)

#### 4. Dashboard (`/api/dashboard`)

- `GET /api/dashboard/branch` - Branch dashboard data (BR only)
- `GET /api/dashboard/ho` - Head Office dashboard data (HO only)

#### 5. Reports (`/api/reports`)

- `GET /api/reports/daily` - Daily branch report
- `GET /api/reports/monthly` - Monthly summary report
- `GET /api/reports/consolidated` - HO consolidated report (HO only)
- `GET /api/reports/custom` - Custom report with filters

#### 6. Metrics (`/api/metrics`)

- `GET /api/metrics/online-cih-tso?date=YYYY-MM-DD` – Per-branch Online Cash In Hand & TSO totals for a day (Branch role sees own branch only; others see all)

Query Parameters:
\n- `date` (optional) ISO date `YYYY-MM-DD`; defaults to today if omitted.

Response Example:

```json
{
   "success": true,
   "data": {
      "date": "2025-11-18T00:00:00.000Z",
      "generatedAt": "2025-11-18T10:12:00.000Z",
      "generatedBy": "HO User",
      "metrics": [
         { "branch": { "id": "...", "name": "Lagos", "code": "LG" }, "onlineCIH": 290, "tso": 210 }
      ],
      "totals": { "totalOnlineCIH": 290, "totalTSO": 210, "branchCount": 1 },
      "raw": [
         { "branch": { "id": "...", "name": "Lagos", "code": "LG" }, "onlineCIH": 290, "tso": 210, "date": "2025-11-18T00:00:00.000Z" }
      ]
   }
}
```

#### 7. System Metrics (`/api/system-metrics`)

- `GET /api/system-metrics` – Internal uptime & request counters (HO/Admin only)

#### 6. Legacy Cashbook (`/api/cashbook`)

- Maintained for backward compatibility

## Data Models

### Core Operational Models

#### 1. Cashbook1 - Daily Input by Branch

- **Fields**: PCIH, Savings, Loan Collection, Charges Collection, Total, FRM HO, FRM BR, CB TOTAL 1
- **Editable by BR**: PCIH, Savings, Loan Collection, Charges Collection
- **Editable by HO**: FRM HO, FRM BR
- **System Calculated**: Total, CB TOTAL 1

#### 2. Cashbook2 - Daily Input by Branch

- **Fields**: DIS NO, DIS AMT, DIS WIT INT, SAV WITH, DOMI BANK, POS/T, CB TOTAL 2
- **Editable by BR**: All fields
- **System Calculated**: CB TOTAL 2

#### 3. Online Cash in Hand (ONLINE CIH)

- **Calculation**: CB TOTAL 1 - CB TOTAL 2
- **Viewable by**: Both HO & BR

#### 4. Loan Register

- **Fields**: Current Loan Balance, Previous Loan Total
- **Logic**: (Previous total * HO rate) + Loan disbursement with interest - Loan collection

#### 5. Savings Register

- **Fields**: Current Savings, Previous Savings Total
- **Logic**: Savings + Previous total savings - Savings withdrawal

#### 6. Prediction (Next Day Projection)

- **Fields**: PREDICTION NO, PREDICTION AMOUNT
- **Editable by**: BR

#### 7. Bank Statement 1st (BS1)

- **Fields**: OPENING, REC HO, REC BO, DOMI, P.A, BS1 TOTAL
- **System calculated** from various cashbook fields

#### 8. Bank Statement 2nd (BS2)

- **Fields**: WITHD, T.B.O, EX AMT, EX PURPOSE, BS2 TOTAL
- **Editable fields**: T.B.O (HO), EX AMT & EX PURPOSE (BR)

#### 9. Transfer to Senate Office (T.S.O)

- **Calculation**: BS1 - BS2
- **Viewable by**: Both HO & BR

#### 10. Disbursement Roll

- **Logic**: Previous Disbursement (HO input) + Daily Disbursement
- **Monthly tracking** of loan flow

## Key Features Implemented

### Email Notifications (Brevo Integration)

- Automatic email sent to HO users when a branch logs in
- Configured to use Brevo SMTP service
- Templates for various notifications

### Dashboard Analytics

- **Branch Dashboard**: Daily summaries, trend charts, register balances
- **HO Dashboard**: Consolidated view, branch performance comparison, system-wide metrics
- **Metrics Endpoint**: Fast numerical roll-up of Online CIH & TSO plus raw per-operation values

### Report Generation

- **Daily Reports**: Complete branch operations for a specific date
- **Monthly Reports**: Comprehensive monthly summaries with loan/savings movement
- **Consolidated Reports**: System-wide HO reports with grand totals
- **Custom Reports**: Flexible reporting with date ranges and grouping options

### Role-Based Access Control

- Strict separation between HO and BR roles
- Field-level access control (HO-only fields vs BR-editable fields)
- Endpoint-level authorization

### Data Validation & Calculations

- Automatic calculation of derived fields
- Pre-save middleware for complex business logic
- Input validation and error handling

## Environment Configuration

## Standard Response Envelope

All API responses (success or error) conform to a unified envelope to aid client consistency, logging, and monitoring.

Success payload structure:

```json
{
   "success": true,
   "statusCode": 200,
   "message": "Human readable message",
   "timestamp": "2025-11-18T10:15:00.123Z",
   "data": { /* endpoint specific resource(s) */ },
   "meta": { /* optional pagination or contextual metadata */ }
}
```

Error payload structure:

```json
{
   "success": false,
   "statusCode": 400,
   "message": "Validation failed",
   "timestamp": "2025-11-18T10:15:00.456Z",
   "errors": [
      { "field": "email", "message": "Email is required" }
   ],
   "meta": { /* optional context (e.g. correlationId) */ }
}
```

Helper utilities:

- `success(res, data, message = 'OK', statusCode = 200, meta)`
- `failure(res, message = 'Error', statusCode = 500, errors, meta)`

Notes:

- `timestamp` is ISO 8601 and added automatically.
- `statusCode` mirrors the HTTP status for easier mobile client parsing.
- `data`, `errors`, and `meta` are omitted when not provided (sent as `undefined`).
- Pagination responses include `meta.pagination` or a dedicated `pagination` object within `data` depending on endpoint design.

Example paginated list (branches):

```json
{
   "success": true,
   "statusCode": 200,
   "message": "Branches fetched",
   "timestamp": "2025-11-18T10:20:00.000Z",
   "data": {
      "count": 20,
      "total": 125,
      "pagination": { "page": 1, "limit": 20, "pages": 7, "total": 125, "hasNext": true, "hasPrev": false },
      "branches": [ { "id": "...", "name": "Lagos" } ]
   }
}
```

## Pagination Pattern

All paginated endpoints accept the following query parameters:

- `page` (number, default 1)
- `limit` (number, default 10, max 100)
- `startDate` / `endDate` (ISO date range filters where applicable)
- Resource specific filters (e.g. `branchId`)

Response embeds pagination metadata inside `data.pagination`:

```json
{
   "success": true,
   "statusCode": 200,
   "message": "Operations history fetched",
   "timestamp": "2025-11-18T10:30:00.000Z",
   "data": {
      "total": 125,
      "pagination": { "page": 1, "limit": 20, "pages": 7, "total": 125, "hasNext": true, "hasPrev": false },
      "records": [ { "id": "...", "date": "2025-11-17T00:00:00.000Z", "onlineCIH": 290, "tso": 210 } ],
      "range": { "start": "2025-10-19T00:00:00.000Z", "end": "2025-11-18T00:00:00.000Z" }
   }
}
```

Notes:

- Date range defaults to the last 30 days when not provided.
- Branch role cannot override `branchId` (enforced server-side).
- Empty result sets still return pagination with `pages` = 1 and `records` = [].
- `hasNext` / `hasPrev` assist clients in rendering navigation controls without extra math.

Clients should rely on `success` and `statusCode` for top-level flow control and inspect `data` or `errors` for details.

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dominion-operations
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
BREVO_SMTP_USER=your-brevo-email@domain.com
BREVO_SMTP_PASS=your-brevo-smtp-key
FROM_NAME=Dominion Operations System
FROM_EMAIL=noreply@dominionoperations.com
```

## Installation & Startup

1. Navigate to the server directory:

```bash
cd server
```

1. Install dependencies (already done):

```bash
npm install
```

1. Create and configure your `.env` file based on `.env.example`

1. Start the development server:

```bash
npm run dev
```

1. For production:

```bash
npm start
```

## API Testing

The API includes a health check endpoint:

- `GET /api/health` - Returns system status and version information

Example Postman request (Online CIH & TSO):

- Method: `GET`
- URL: `{{baseUrl}}/api/v1/metrics/online-cih-tso?date={{date}}`
- Headers: `Authorization: Bearer {{authToken}}`
- Pre-request Script:

```javascript
if (!pm.request.url.query.has('date')) {
   pm.request.url.query.add({ key: 'date', value: new Date().toISOString().slice(0,10) });
}
```

- Tests:

```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
const json = pm.response.json();
pm.test('Has data', () => pm.expect(json.data).to.have.property('metrics'));
```

## Database Structure

The system uses MongoDB with the following collections:

- `users` - User accounts (HO/BR)
- `branches` - Branch information and settings
- `cashbook1s` - Daily Cashbook 1 entries
- `cashbook2s` - Daily Cashbook 2 entries
- `loanregisters` - Loan balance tracking
- `savingsregisters` - Savings balance tracking
- `predictions` - Next-day predictions
- `bankstatement1s` - Bank Statement 1 data
- `bankstatement2s` - Bank Statement 2 data
- `dailyoperations` - Master daily operations records
- `disbursementrolls` - Monthly disbursement tracking

## Acceptance Criteria Status ✅

✅ HO can view, manage, and track all branches  
✅ Branch can input and view daily operational data  
✅ All formulas auto-calculate correctly  
✅ Email triggers when branch logs in (via Brevo)  
✅ Reports are exportable and accessible  
✅ Role-based access control implemented  
✅ Real-time dashboard metrics  
✅ Automated daily reporting system  

The system is now fully operational and ready for deployment!
