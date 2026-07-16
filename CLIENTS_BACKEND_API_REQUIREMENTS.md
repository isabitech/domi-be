# Clients and Staff Module Backend API Requirements

## Purpose
This document defines backend updates required to support both:

1. frontend clients feature (branch and HO views)
2. frontend staff information feature (HO only)

using the exact field formats provided by operations.

## Client Data Format (Required)
Each client record must support all fields below:

1. S/N (frontend-generated serial number for table display only)
2. UNION
3. CLIENTS NAME
4. PHONE NUMBER (client)
5. NICK NAME (client)
6. GUARANTOR NAME
7. PHONE NUMBER (guarantor)
8. NICKNAME (guarantor)
9. PARTNER/REFEERER NAME
10. PHONE NUMBER (partner/refeerer)

### Canonical API Field Names
Use these JSON keys in request/response payloads:

- union
- clientName
- clientPhone
- clientNickName
- guarantorName
- guarantorPhone
- guarantorNickName
- partnerReferrerName
- partnerReferrerPhone
- status (`active | inactive`)
- branchId (or branch object in responses)

`S/N` is not persisted in backend; it is computed in frontend from pagination.

## Frontend Behavior Expected

1. Branch users can see Client Information in sidebar after login.
2. Branch users can create, edit, delete clients in their branch.
3. Client table and downloadable list include all required fields above.
4. Head Office users can click View Clients under Branch Management and view branch clients.
5. Branch Management shows total clients per branch.
6. HO Dashboard summary shows total clients and branch performance includes total clients.

## Required Endpoints

### 1) List Clients
`GET /api/v1/clients`

Query params:

- page (number, optional)
- limit (number, optional)
- branchId (string, optional)
- search (string, optional)
- status (`active | inactive`, optional)

Search should match at least:

- union
- clientName
- clientPhone
- clientNickName
- guarantorName
- guarantorPhone
- guarantorNickName
- partnerReferrerName
- partnerReferrerPhone

Role rules:

- BR: only own branch clients (ignore foreign branchId).
- HO/admin: can query any branch.

Response example:

```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "_id": "68771d012aa7f8f7309b2b21",
        "union": "PRAISE THY LORD",
        "clientName": "FAVOUR HADASSAH",
        "clientPhone": "08025000000",
        "clientNickName": "HADA",
        "guarantorName": "FAVOUR HADASSAH",
        "guarantorPhone": "08025111111",
        "guarantorNickName": "HADA",
        "partnerReferrerName": "FAVOUR HADASSAH",
        "partnerReferrerPhone": "08025222222",
        "status": "active",
        "branch": {
          "_id": "685fd12f9a1cf02b76127001",
          "name": "Lagos Mainland",
          "code": "LMB001"
        },
        "branchId": "685fd12f9a1cf02b76127001",
        "createdAt": "2026-07-16T09:30:00.000Z",
        "updatedAt": "2026-07-16T09:30:00.000Z"
      }
    ],
    "count": 10,
    "total": 125,
    "pagination": {
      "page": 1,
      "limit": 10,
      "pages": 13,
      "total": 125,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Clients fetched successfully"
}
```

### 2) Create Client
`POST /api/v1/clients`

Request body:

```json
{
  "union": "PRAISE THY LORD",
  "clientName": "FAVOUR HADASSAH",
  "clientPhone": "08025000000",
  "clientNickName": "HADA",
  "guarantorName": "FAVOUR HADASSAH",
  "guarantorPhone": "08025111111",
  "guarantorNickName": "HADA",
  "partnerReferrerName": "FAVOUR HADASSAH",
  "partnerReferrerPhone": "08025222222",
  "status": "active",
  "branchId": "685fd12f9a1cf02b76127001"
}
```

Role rules:

- BR: branchId should be ignored and replaced with logged-in branch.
- HO/admin: branchId required to create for target branch.

Response:

```json
{
  "success": true,
  "data": {
    "client": {
      "_id": "68771d012aa7f8f7309b2b21"
    }
  },
  "message": "Client created successfully"
}
```

### 3) Update Client
`PUT /api/v1/clients/:id`

Partial update body example:

```json
{
  "union": "IBUKUN",
  "clientName": "TOPE JOHN",
  "clientPhone": "08025000001",
  "clientNickName": "HADA",
  "guarantorName": "FAVOUR HADASSAH",
  "guarantorPhone": "08025111112",
  "guarantorNickName": "HADA",
  "partnerReferrerName": "FAVOUR HADASSAH",
  "partnerReferrerPhone": "08025222223",
  "status": "active"
}
```

Role rules:

- BR: update only own branch clients.
- HO/admin: update any client.

### 4) Delete Client
`DELETE /api/v1/clients/:id`

Role rules:

- BR: delete only own branch clients.
- HO/admin: delete any client.

### 5) Client Summary
`GET /api/v1/clients/summary`

Used by:

- Branch Management table total clients per branch.
- HO Dashboard total clients summary.

Response example:

```json
{
  "success": true,
  "data": {
    "totalClients": 2450,
    "branches": [
      {
        "branchId": "685fd12f9a1cf02b76127001",
        "branchName": "Lagos Mainland",
        "branchCode": "LMB001",
        "totalClients": 320
      },
      {
        "branchId": "685fd12f9a1cf02b76127002",
        "branchName": "Lekki",
        "branchCode": "LEK001",
        "totalClients": 287
      }
    ]
  },
  "message": "Client summary fetched successfully"
}
```

## Existing Endpoint Updates Required

### A) HO Dashboard
Endpoint: `GET /api/v1/dashboard/ho`

Add:

- `dashboardData.consolidatedSummary.totalClients`
- `dashboardData.branchPerformance[].totalClients`

Example shape:

```json
{
  "data": {
    "dashboardData": {
      "consolidatedSummary": {
        "totalClients": 2450
      },
      "branchPerformance": [
        {
          "branchName": "Lagos Mainland",
          "totalClients": 320
        }
      ]
    }
  }
}
```

### B) Optional Branches Optimization
Endpoint: `GET /api/v1/branches`

Optional but recommended: include `totalClients` in each branch payload so frontend can avoid an extra summary call.

## Suggested Data Model

Collection: `clients`

Fields:

- _id
- union (required)
- clientName (required)
- clientPhone (required)
- clientNickName (optional)
- guarantorName (required)
- guarantorPhone (required)
- guarantorNickName (optional)
- partnerReferrerName (required)
- partnerReferrerPhone (required)
- status (`active | inactive`, default `active`)
- branch (ObjectId ref branches, required)
- createdBy (ObjectId ref users)
- updatedBy (ObjectId ref users)
- createdAt
- updatedAt

Recommended indexes:

- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, status: 1 }`
- `{ branch: 1, clientPhone: 1 }`
- text index across union, clientName, clientPhone, guarantorName, guarantorPhone, partnerReferrerName, partnerReferrerPhone

## Validation Rules

- Required: union, clientName, clientPhone, guarantorName, guarantorPhone, partnerReferrerName, partnerReferrerPhone.
- status must be `active` or `inactive`.
- clientPhone, guarantorPhone, partnerReferrerPhone should pass phone format validation.
- For BR create/update, enforce branch ownership.

## Download Notes

Frontend currently exports current list view to `.xlsx` with all required columns.
No dedicated export endpoint is required for now.

Optional future endpoint:

- `GET /api/v1/clients/export?branchId=...&format=xlsx|csv`

---

## Staff Information (HO Only)

### Staff Data Format (Required)
Each staff record must support all fields below:

1. S/N (frontend-generated serial number for table display only)
2. STAFF NAME
3. STAFF I.D NUMBER
4. EMPLOYMENT DATE
5. CURRENT POSITION
6. CURRENT BRANCH
7. RESIDENTIAL ADDRESS
8. GUARANTOR NAME
9. GUARANTOR NUMBER
10. GENDER

### Canonical API Field Names
Use these JSON keys in request/response payloads:

- staffName
- staffIdNumber
- employmentDate
- currentPosition
- currentBranch
- branchId (or branch object in responses)
- residentialAddress
- guarantorName
- guarantorNumber
- gender (`male | female`)

`S/N` is not persisted in backend; it is computed in frontend from pagination.

### Frontend Behavior Expected

1. Staff Information appears in HO sidebar only.
2. HO can create, edit, delete, and list staff information records.
3. Staff table and downloaded list include all required fields above.
4. BR users are not allowed to access staff endpoints or staff page.

### Required Endpoints

#### 1) List Staff
`GET /api/v1/staff`

Query params:

- page (number, optional)
- limit (number, optional)
- branchId (string, optional)
- search (string, optional)
- gender (`male | female`, optional)

Search should match at least:

- staffName
- staffIdNumber
- currentPosition
- currentBranch
- residentialAddress
- guarantorName
- guarantorNumber

Role rules:

- HO/admin: full access.
- BR: no access (403).

Response example:

```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "_id": "6877a0e66bbf0f2f9f42a321",
        "staffName": "TOPE JOHN",
        "staffIdNumber": "DS-HO-001",
        "employmentDate": "2024-02-01",
        "currentPosition": "Branch Supervisor",
        "currentBranch": "IBUKUN",
        "branchId": "685fd12f9a1cf02b76127002",
        "residentialAddress": "Akure, Ondo State",
        "guarantorName": "FAVOUR HADASSAH",
        "guarantorNumber": "08025111111",
        "gender": "female",
        "branch": {
          "_id": "685fd12f9a1cf02b76127002",
          "name": "IBUKUN",
          "code": "IBK001"
        },
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
  "message": "Staff records fetched successfully"
}
```

#### 2) Create Staff Record
`POST /api/v1/staff`

Request body:

```json
{
  "staffName": "TOPE JOHN",
  "staffIdNumber": "DS-HO-001",
  "employmentDate": "2024-02-01",
  "currentPosition": "Branch Supervisor",
  "currentBranch": "IBUKUN",
  "branchId": "685fd12f9a1cf02b76127002",
  "residentialAddress": "Akure, Ondo State",
  "guarantorName": "FAVOUR HADASSAH",
  "guarantorNumber": "08025111111",
  "gender": "female"
}
```

Role rules:

- HO/admin only.
- `staffIdNumber` should be unique.

Response:

```json
{
  "success": true,
  "data": {
    "staff": {
      "_id": "6877a0e66bbf0f2f9f42a321"
    }
  },
  "message": "Staff record created successfully"
}
```

#### 3) Update Staff Record
`PUT /api/v1/staff/:id`

Partial update body example:

```json
{
  "currentPosition": "Regional Supervisor",
  "currentBranch": "MUSTER SEED",
  "branchId": "685fd12f9a1cf02b76127003"
}
```

Role rules:

- HO/admin only.
- `staffIdNumber` uniqueness should be enforced when updated.

#### 4) Delete Staff Record
`DELETE /api/v1/staff/:id`

Role rules:

- HO/admin only.

Response:

```json
{
  "success": true,
  "message": "Staff record deleted successfully"
}
```

### Suggested Staff Data Model

Collection: `staff`

Fields:

- _id
- staffName (required)
- staffIdNumber (required, unique)
- employmentDate (required)
- currentPosition (required)
- currentBranch (required)
- branch (ObjectId ref branches, required)
- residentialAddress (required)
- guarantorName (required)
- guarantorNumber (required)
- gender (`male | female`, required)
- createdBy (ObjectId ref users)
- updatedBy (ObjectId ref users)
- createdAt
- updatedAt

Recommended indexes:

- `{ staffIdNumber: 1 }` unique
- `{ branch: 1, employmentDate: -1 }`
- `{ branch: 1, gender: 1 }`
- text index across staffName, staffIdNumber, currentPosition, currentBranch, guarantorName, guarantorNumber

### Validation Rules

- Required: staffName, staffIdNumber, employmentDate, currentPosition, currentBranch, branchId, residentialAddress, guarantorName, guarantorNumber, gender.
- employmentDate should be a valid date (frontend sends `YYYY-MM-DD`).
- gender must be `male` or `female`.
- guarantorNumber should pass phone format validation.

### Staff Download Notes

Frontend currently exports current staff table view to `.xlsx` with all required columns.
No dedicated export endpoint is required for now.
