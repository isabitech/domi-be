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

#### 4. Dashboard (`/api/dashboard`)
- `GET /api/dashboard/branch` - Branch dashboard data (BR only)
- `GET /api/dashboard/ho` - Head Office dashboard data (HO only)

#### 5. Reports (`/api/reports`)
- `GET /api/reports/daily` - Daily branch report
- `GET /api/reports/monthly` - Monthly summary report
- `GET /api/reports/consolidated` - HO consolidated report (HO only)
- `GET /api/reports/custom` - Custom report with filters

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

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Create and configure your `.env` file based on `.env.example`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production:
   ```bash
   npm start
   ```

## API Testing

The API includes a health check endpoint:
- `GET /api/health` - Returns system status and version information

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