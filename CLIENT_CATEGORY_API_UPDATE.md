# Client Category API Update

This document describes the minimal backend update needed to support the new client category field in the Add/Edit Client modal.

## New field

Add support for an optional `clientCategory` field on client create and update.

Allowed values:
- `loan_only`
- `savings_only`
- `loan_and_savings`

## Backend contract

### Create Client
Endpoint: `POST /api/v1/clients`

Request body must accept the existing client fields plus:
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
  "partnerReferrerNickName": "HADA",
  "status": "active",
  "clientCategory": "loan_and_savings",
  "branchId": "685fd12f9a1cf02b76127001"
}
```

### Update Client
Endpoint: `PUT /api/v1/clients/:id`

Request body may include `clientCategory` for partial updates:
```json
{
  "status": "active",
  "clientCategory": "savings_only"
}
```

### List Clients
Endpoint: `GET /api/v1/clients`

Response client objects must include `clientCategory` when present:
```json
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
  "partnerReferrerNickName": "HADA",
  "status": "active",
  "clientCategory": "loan_only",
  "branch": {
    "_id": "685fd12f9a1cf02b76127001",
    "name": "Lagos Mainland",
    "code": "LMB001"
  },
  "branchId": "685fd12f9a1cf02b76127001",
  "createdAt": "2026-07-16T09:30:00.000Z",
  "updatedAt": "2026-07-16T09:30:00.000Z"
}
```

## Notes
- `clientCategory` is optional.
- If absent, treat the client as having no category set.
- No UI changes require new values outside the three allowed options.
- The frontend will use this field in the Add Client modal and client list display.
