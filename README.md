# Dominion Operations Management System API

A comprehensive backend system for managing branch operations, financial tracking, and reporting for Dominion Seedstars Nig LTD.

## 🏢 Project Overview

This system automates branch daily reporting, provides real-time visibility into financial and loan operations, and simplifies reconciliation between Head Office and branches.

## 🚀 Features

- **Role-Based Access Control**: Separate interfaces for Head Office (HO) and Branch (BR) users
- **Daily Operations Management**: Complete cashbook system with automated calculations
- **Real-Time Dashboards**: Analytics and performance metrics for both HO and BR
- **Comprehensive Reporting**: Daily, monthly, and consolidated reports
- **Email Notifications**: Brevo integration for branch login alerts
- **Automated Calculations**: All business logic formulas implemented according to PRD

## 📋 System Requirements

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/isabitech/domi-be.git
   cd domi-be
   ```

2. **Navigate to server directory:**
   ```bash
   cd server
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` file with your configuration:
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

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Branch Management
- `GET /api/branches` - List all branches
- `POST /api/branches` - Create new branch (HO only)
- `GET /api/branches/:id` - Get branch details
- `PUT /api/branches/:id` - Update branch (HO only)

### Daily Operations
- `GET /api/operations/daily` - Get daily operations
- `POST /api/operations/daily` - Create/update daily operations (BR only)
- `PATCH /api/operations/daily/:id/submit` - Submit daily operations
- `PATCH /api/operations/ho-fields` - Update HO fields (HO only)

### Dashboards
- `GET /api/dashboard/branch` - Branch dashboard (BR only)
- `GET /api/dashboard/ho` - Head Office dashboard (HO only)

### Reports
- `GET /api/reports/daily` - Daily branch report
- `GET /api/reports/monthly` - Monthly summary
- `GET /api/reports/consolidated` - HO consolidated report
- `GET /api/reports/custom` - Custom reports with filters

## 🏗️ System Architecture

### Core Models

1. **Cashbook1**: Daily financial inputs (savings, loan collections, charges)
2. **Cashbook2**: Daily disbursements and withdrawals
3. **LoanRegister**: Loan balance tracking and management
4. **SavingsRegister**: Savings balance management
5. **BankStatement1 & 2**: Bank reconciliation data
6. **Prediction**: Next-day operational forecasts
7. **DisbursementRoll**: Monthly disbursement tracking

### User Roles

- **HO (Head Office)**: Full system access, branch management, reporting
- **BR (Branch)**: Daily operations input, branch-specific data access

## 📈 Key Calculations

- **Online CIH**: CB TOTAL 1 - CB TOTAL 2
- **TSO (Transfer to Senate Office)**: BS1 TOTAL - BS2 TOTAL
- **Current Loan Balance**: Previous Total + Disbursements - Collections
- **Current Savings**: Previous Total + New Savings - Withdrawals

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests (when implemented)
npm test
```

## 📧 Email Integration

The system uses Brevo (formerly Sendinblue) for email notifications:
- Branch login alerts to HO users
- System notifications and reports
- Password reset emails

## 🔒 Security Features

- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- Secure password hashing with bcrypt
- Environment-based configuration

## 📱 API Testing

Use the health check endpoint to verify the system is running:
```
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "Operations Management System API is running!",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 🚀 Deployment

### Prerequisites
- MongoDB Atlas account (for cloud database)
- Brevo account for email services
- Cloud hosting platform (Heroku, AWS, DigitalOcean, etc.)

### Environment Variables for Production
```env
NODE_ENV=production
PORT=443
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dominion-operations
JWT_SECRET=super-secure-production-key
CLIENT_URL=https://your-frontend-domain.com
BREVO_SMTP_USER=your-production-email@domain.com
BREVO_SMTP_PASS=your-production-smtp-key
```

## 📞 Support

For support and questions:
- **Developer**: Isabi Technologies
- **Client**: Dominion Seedstars Nig LTD
- **Project Date**: November 2025

## 📄 License

This project is proprietary software developed for Dominion Seedstars Nig LTD.

---

**Built with ❤️ by Isabi Technologies**