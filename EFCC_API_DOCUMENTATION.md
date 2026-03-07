# EFCC (Expected Financial Compliance Calculation) API Documentation

## Overview
The EFCC feature tracks the amount each branch owes to Head Office, with automatic cumulative calculations across days.

**📧 Email Notifications:**
- Automatic email notifications are sent to all HO users and `dominionglobal2024@gmail.com` when:
  - A branch creates or updates an EFCC record
  - A branch submits an EFCC record
- Emails include detailed financial information and professional HTML formatting

## Formula
```
currentAmountOwing = previousAmountOwing + todayRemittance - amtRemittingNow
```

### First Day Logic:
- `previousAmountOwing`: BR input (initial debt)
- `todayRemittance`: BR input (collected today)
- `amtRemittingNow`: BR input (remitting now)

### Concurrent Days Logic:
- `previousAmountOwing`: Auto-calculated from previous day's `currentAmountOwing`
- `todayRemittance`: BR input (default 0)
- `amtRemittingNow`: BR input

## API Endpoints

### 1. Get Today's EFCC Record (BR/HO)
```http
GET /api/efcc/today
Authorization: Bearer <token>
```

### 2. Create/Update Today's EFCC Record (BR only)
```http
POST /api/efcc/today
Authorization: Bearer <token>
Content-Type: application/json

{
  "todayRemittance": 15000,
  "amtRemittingNow": 10000,
  "previousAmountOwing": 50000
}
```

**📧 Email Notification:** Automatically sends notification to all HO users and global management.

### 3. Submit Today's EFCC Record (BR only)
```http
PATCH /api/efcc/today/submit
Authorization: Bearer <token>
```

**📧 Email Notification:** Sends submission confirmation to all HO users and global management.

### 4. Get All Branches EFCC Summary (HO Dashboard)
```http
GET /api/efcc/summary/all-branches?date=2025-12-06
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-06T00:00:00.000Z",
    "branches": [
      {
        "branch": {
          "_id": "692ef31ad6ea4db16c55d7f0",
          "name": "Main Branch",
          "code": "MB001"
        },
        "previousAmountOwing": 50000,
        "todayRemittance": 15000,
        "amtRemittingNow": 10000,
        "currentAmountOwing": 55000,
        "submittedAt": "2025-12-06T14:30:00.000Z",
        "submittedBy": {
          "_id": "user123",
          "username": "branch_manager"
        },
        "isSubmitted": true,
        "hasRecord": true
      }
    ],
    "totals": {
      "totalPreviousOwing": 150000,
      "totalTodayRemittance": 45000,
      "totalAmtRemittingNow": 30000,
      "totalCurrentOwing": 165000
    },
    "summary": {
      "totalBranches": 5,
      "submittedToday": 3,
      "pendingSubmission": 2
    }
  }
}
```

### 5. Get Branch EFCC Records (HO only)
```http
GET /api/efcc/branch/692ef31ad6ea4db16c55d7f0?startDate=2025-12-01&endDate=2025-12-06&page=1&limit=30
Authorization: Bearer <token>
```

### 6. Get EFCC History
```http
GET /api/efcc/history?page=1&limit=50
Authorization: Bearer <token>
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `previousAmountOwing` | Number | Amount branch owed before today (BR can update anytime) |
| `todayRemittance` | Number | Amount branch collected today |
| `amtRemittingNow` | Number | Amount branch is remitting to HO now |
| `currentAmountOwing` | Number | Calculated amount branch owes after today |
| `submittedAt` | Date | When the record was submitted |
| `submittedBy` | ObjectId | User who submitted the record |
| `isSubmitted` | Boolean | Whether the record has been submitted |

## Email Notifications

### Configuration
Email notifications are sent using the Brevo API with the following configuration:
- **Global Management Email:** `dominionglobal2024@gmail.com`
- **HO Users:** All users with `role: 'HO'` in the database
- **Sender:** Configured via `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME`

### Notification Types

#### 1. EFCC Update Notification
- **Trigger:** When a branch creates/updates an EFCC record
- **Recipients:** All HO users + global management email
- **Content:** Detailed financial breakdown, calculation explanation, branch info

#### 2. EFCC Submission Notification  
- **Trigger:** When a branch submits an EFCC record
- **Recipients:** All HO users + global management email
- **Content:** Submission confirmation with final amounts

### Email Features
- 📱 **Mobile-responsive HTML design**
- 💰 **Properly formatted currency (₦)**
- 🎨 **Professional styling with company branding**
- 📊 **Visual calculation breakdown**
- 🔗 **Direct links to dashboard**
- 📱 **Plain text fallback for all clients**

## Permissions

- **BR (Branch)**: Can create, update, submit own branch records, including updating `previousAmountOwing`
- **HO/Admin**: Can view all branches, individual branch records, summaries

## Example Usage Flow

1. **First Day** (BR):
   ```json
   POST /api/efcc/today
   {
     "previousAmountOwing": 50000,
     "todayRemittance": 10000,
     "amtRemittingNow": 20000
   }
   // Result: currentAmountOwing = 50000 + 10000 - 20000 = 40000
   ```

2. **Second Day** (BR):
   ```json
   POST /api/efcc/today
   {
     "todayRemittance": 15000,
     "amtRemittingNow": 10000
   }
   // Result: currentAmountOwing = 40000 + 15000 - 10000 = 45000
   ```

3. **Submit** (BR):
   ```http
   PATCH /api/efcc/today/submit
   ```

4. **HO Dashboard**:
   ```http
   GET /api/efcc/summary/all-branches
   ```

## Error Handling

- `400 Bad Request`: Validation errors, negative amounts
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Branch or record not found
- `409 Conflict`: Record already submitted