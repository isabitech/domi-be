# Investor Information Backend API Requirements

## Purpose
This document defines backend updates required for the Head Office Investor Information frontend module.

## Scope
Investor Information is Head Office only and supports:

1. List investor records
2. Add investor record
3. Edit investor record
4. Delete investor record
5. Download investor list (frontend XLSX export from API data)

## Required Investor Fields
Each investor record must include:

1. S/N (frontend generated serial, not persisted)
2. Investor name
3. Gender
4. Phone
5. R.I.O Date
6. Status (paid, update, withdrawal)

## Canonical API Field Names
Use these JSON keys in request/response payloads:

- investorName
- gender (`male | female`)
- phone
- rioDate (YYYY-MM-DD)
- status (`paid | update | withdrawal`)

## Required Endpoints

### 1) List Investors
GET /api/v1/investors

Query params:

- page (number, optional)
- limit (number, optional)
- search (string, optional)
- gender (`male | female`, optional)
- status (`paid | update | withdrawal`, optional)

Search should match at least:

- investorName
- phone
- status

Role rules:

- HO/admin: full access
- BR: no access (return 403)

Response example:

```json
{
  "success": true,
  "data": {
    "investors": [
      {
        "_id": "6878a0e66bbf0f2f9f42a999",
        "investorName": "AYODEJI ADEMOLA",
        "gender": "male",
        "phone": "08031112222",
        "rioDate": "2026-07-15",
        "status": "paid",
        "createdAt": "2026-07-16T09:30:00.000Z",
        "updatedAt": "2026-07-16T09:30:00.000Z"
      }
    ],
    "count": 10,
    "total": 42,
    "pagination": {
      "page": 1,
      "limit": 10,
      "pages": 5,
      "total": 42,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Investor records fetched successfully"
}
```

### 2) Create Investor Record
POST /api/v1/investors

Request body:

```json
{
  "investorName": "AYODEJI ADEMOLA",
  "gender": "male",
  "phone": "08031112222",
  "rioDate": "2026-07-15",
  "status": "paid"
}
```

Rules:

- HO/admin only

Response:

```json
{
  "success": true,
  "data": {
    "investor": {
      "_id": "6878a0e66bbf0f2f9f42a999"
    }
  },
  "message": "Investor record created successfully"
}
```

### 3) Update Investor Record
PUT /api/v1/investors/:id

Partial update body example:

```json
{
  "phone": "08032223333",
  "status": "withdrawal"
}
```

Rules:

- HO/admin only

### 4) Delete Investor Record
DELETE /api/v1/investors/:id

Rules:

- HO/admin only

Response:

```json
{
  "success": true,
  "message": "Investor record deleted successfully"
}
```

## Suggested Data Model
Collection: investors

Fields:

- _id
- investorName (required)
- gender (`male | female`, required)
- phone (required)
- rioDate (required)
- status (`paid | update | withdrawal`, required)
- createdBy (ObjectId ref users)
- updatedBy (ObjectId ref users)
- createdAt
- updatedAt

Recommended indexes:

- { status: 1, rioDate: -1 }
- { gender: 1, status: 1 }
- { phone: 1 }
- text index: investorName, phone, status

## Validation Rules

- Required: investorName, gender, phone, rioDate, status
- rioDate should be valid ISO date input (frontend sends YYYY-MM-DD)
- gender must be male or female
- status must be paid, update, or withdrawal
- phone must be valid phone format

## Download Notes
Frontend currently exports fetched table rows to XLSX.
No dedicated export endpoint is required for this iteration.