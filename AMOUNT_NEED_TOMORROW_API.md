# Amount Need Tomorrow API Documentation

## Overview
The Amount Need Tomorrow API allows branches to input their expected financial needs for the next day across three categories: loans, savings withdrawals, and expenses. HO can view all branches' needs for planning and cash flow management.

## Base URL
```
http://localhost:5000/api/amount-need-tomorrow
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Branch Endpoints

### 1. Create/Update Amount Need Tomorrow
**POST** `/api/amount-need-tomorrow`

Creates a new entry or updates existing entry for the current date.

**Request Body:**
```json
{
  "loanAmount": 500000,
  "savingsWithdrawalAmount": 200000,
  "expensesAmount": 50000,
  "notes": "Expected high demand tomorrow",
  "date": "2025-12-12T00:00:00.000Z"  // Optional, defaults to today
}
```

**Response:**
```json
{
  "success": true,
  "message": "Amount need tomorrow created successfully",
  "data": {
    "_id": "675a1b2c3d4e5f6789abcdef",
    "branch": "692ef30ad6ea4db16c55d78a",
    "date": "2025-12-12T00:00:00.000Z",
    "loanAmount": 500000,
    "savingsWithdrawalAmount": 200000,
    "expensesAmount": 50000,
    "total": 750000,
    "notes": "Expected high demand tomorrow",
    "submittedBy": "692ef2f9c317587e7ca1c981",
    "createdAt": "2025-12-11T14:30:00.000Z",
    "updatedAt": "2025-12-11T14:30:00.000Z"
  }
}
```

### 2. Get Latest Amount Need Tomorrow
**GET** `/api/amount-need-tomorrow`

Retrieves the most recent amount need tomorrow entry for the current branch.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "675a1b2c3d4e5f6789abcdef",
    "branch": "692ef30ad6ea4db16c55d78a",
    "date": "2025-12-12T00:00:00.000Z",
    "loanAmount": 500000,
    "savingsWithdrawalAmount": 200000,
    "expensesAmount": 50000,
    "total": 750000,
    "notes": "Expected high demand tomorrow",
    "submittedBy": {
      "username": "branch_manager",
      "email": "manager@branch.com"
    },
    "formattedDate": "12/12/2025",
    "createdAt": "2025-12-11T14:30:00.000Z",
    "updatedAt": "2025-12-11T14:30:00.000Z"
  }
}
```

### 3. Get Amount Need Tomorrow by Date
**GET** `/api/amount-need-tomorrow/date/:date`

Retrieves amount need tomorrow entry for a specific date.

**Parameters:**
- `date` - ISO date string (e.g., "2025-12-12")

**Example Request:**
```
GET /api/amount-need-tomorrow/date/2025-12-12
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same structure as above
  }
}
```

### 4. Get History
**GET** `/api/amount-need-tomorrow/history?page=1&limit=10`

Retrieves paginated history of amount need tomorrow entries for the current branch.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      // Array of amount need tomorrow entries
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 25
  }
}
```

### 5. Delete Entry
**DELETE** `/api/amount-need-tomorrow/:id`

Deletes a specific amount need tomorrow entry.

**Parameters:**
- `id` - Entry ID

**Response:**
```json
{
  "success": true,
  "message": "Amount need tomorrow entry deleted successfully"
}
```

---

## HO (Admin) Endpoints

### 6. Get All Branches Amount Need Tomorrow
**GET** `/api/amount-need-tomorrow/all`

Retrieves the latest amount need tomorrow entries for all branches. **Requires admin/superadmin role.**

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "675a1b2c3d4e5f6789abcdef",
      "branch": "692ef30ad6ea4db16c55d78a",
      "branchName": "Miracle and Wonders",
      "branchCode": "DM001",
      "date": "2025-12-12T00:00:00.000Z",
      "loanAmount": 500000,
      "savingsWithdrawalAmount": 200000,
      "expensesAmount": 50000,
      "total": 750000,
      "notes": "Expected high demand tomorrow",
      "submittedByUser": {
        "username": "branch_manager",
        "email": "manager@branch.com"
      },
      "createdAt": "2025-12-11T14:30:00.000Z",
      "updatedAt": "2025-12-11T14:30:00.000Z"
    },
    // ... more branches
  ],
  "count": 15
}
```

---

## Integration with Operations API

The amount need tomorrow data is automatically included in the operations endpoint:

### Operations API Integration
**GET** `/api/operations/all`

The response now includes `amountNeedTomorrow` field for each operation:

```json
{
  "success": true,
  "data": {
    "operations": [
      {
        "branch": {
          "name": "Miracle and Wonders",
          "_id": "692ef30ad6ea4db16c55d78a"
        },
        "date": "2025-12-11T00:00:00.000Z",
        "cashbook1": { /* ... */ },
        "cashbook2": { /* ... */ },
        "predictions": { /* ... */ },
        "disbursementRoll": { /* ... */ },
        "amountNeedTomorrow": {
          "_id": "675a1b2c3d4e5f6789abcdef",
          "loanAmount": 500000,
          "savingsWithdrawalAmount": 200000,
          "expensesAmount": 50000,
          "total": 750000,
          "notes": "Expected high demand tomorrow",
          "date": "2025-12-12T00:00:00.000Z",
          "submittedBy": {
            "username": "branch_manager",
            "email": "manager@branch.com"
          }
        }
      }
    ]
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "details": "loanAmount must be a positive number"
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Access denied. Authentication required"
}
```

### Authorization Error (HO endpoints)
```json
{
  "success": false,
  "message": "Access denied. HO privileges required."
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Amount need tomorrow entry not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Failed to save amount need tomorrow",
  "error": "Database connection error"
}
```

---

## Field Validation

### Request Body Validation
- `loanAmount`: Number ≥ 0 (default: 0)
- `savingsWithdrawalAmount`: Number ≥ 0 (default: 0)
- `expensesAmount`: Number ≥ 0 (default: 0)
- `notes`: String, max 500 characters (optional)
- `date`: ISO date string (optional, defaults to current date)

### Automatic Calculations
- `total` is automatically calculated as: `loanAmount + savingsWithdrawalAmount + expensesAmount`
- `date` is normalized to start of day (00:00:00)

---

## Usage Examples

### Frontend Implementation Example

```javascript
// Create/Update amount need tomorrow
const createAmountNeed = async (data) => {
  const response = await fetch('/api/amount-need-tomorrow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      loanAmount: data.loanAmount,
      savingsWithdrawalAmount: data.savingsWithdrawalAmount,
      expensesAmount: data.expensesAmount,
      notes: data.notes
    })
  });
  
  return response.json();
};

// Get latest for current branch
const getLatestAmountNeed = async () => {
  const response = await fetch('/api/amount-need-tomorrow', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};

// HO: Get all branches (admin only)
const getAllBranchesAmountNeed = async () => {
  const response = await fetch('/api/amount-need-tomorrow/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Form Data Structure

```javascript
const formData = {
  loanAmount: 500000,           // Required: Amount needed for loans
  savingsWithdrawalAmount: 200000, // Required: Amount needed for withdrawals
  expensesAmount: 50000,        // Required: Amount needed for expenses
  notes: "High demand expected" // Optional: Additional notes
};
```