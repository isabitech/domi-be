import json
import uuid
from datetime import date
from pathlib import Path

def raw_body(data):
    return {
        "mode": "raw",
        "raw": json.dumps(data, indent=2),
        "options": {"raw": {"language": "json"}}
    }

def build_headers(auth=False, content_type=False):
    headers = []
    if content_type:
        headers.append({"key": "Content-Type", "value": "application/json"})
    if auth:
        headers.append({"key": "Authorization", "value": "Bearer {{bearer_token}}"})
    return headers

def make_request(name, method, url, description, auth=False, body=None, content_type=False):
    request = {
        "name": f"{method} {name}",
        "request": {
            "method": method,
            "header": build_headers(auth, content_type),
            "url": url,
            "description": description
        }
    }
    if body is not None:
        request["request"]["body"] = raw_body(body)
    return request

collection = {
    "info": {
        "name": "Dominion OMS PRD-Aligned Collection",
        "_postman_id": str(uuid.uuid4()),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "description": (
            "Flow-driven Postman v2.1 collection regenerated on {today} to mirror the Dominion Seedstars "
            "Operations Management PRD. Requests are organized in the exact order the PRD describes: "
            "platform readiness, authentication, HO setup, branch daily runbook, HO oversight, dashboards, "
            "reports, and compliance. Middleware (protect, authorizeHO, requirePermission) and rate limiters "
            "from server/src/app.js are documented per request so QA and product stakeholders can replay the "
            "intended experience end-to-end."
        ).format(today=date.today().isoformat()),
        "version": date.today().isoformat().replace('-', '.')
    },
    "variable": [
        {"key": "base_url", "value": "http://localhost:5000/api/v1"},
        {"key": "bearer_token", "value": ""},
        {"key": "USER_ID", "value": "64d1ad8ebd54c3b8e7612345"},
        {"key": "BRANCH_ID", "value": "64d1ad8ebd54c3b8e7699999"},
        {"key": "DAILY_OPS_ID", "value": "64d1ad8ebd54c3b8e7601111"},
        {"key": "CASHBOOK_ID", "value": "64d1ad8ebd54c3b8e7602222"},
        {"key": "RESET_TOKEN", "value": "mock-reset-token"},
        {"key": "REPORT_START", "value": "2025-11-01"},
        {"key": "REPORT_END", "value": "2025-11-27"},
        {"key": "MONTH", "value": "11"},
        {"key": "YEAR", "value": "2025"},
        {"key": "TBO_TARGET_BRANCH", "value": "64d1ad8ebd54c3b8e7603333"}
    ],
    "item": []
}

platform_folder = {
    "name": "00 · Platform Baseline",
    "description": "Entry points from PRD section 4 (Authentication & Access Control) ensuring the platform is reachable before role-based flows start.",
    "item": [
        make_request(
            "Service Health",
            "GET",
            "{{base_url}}/health",
            "Public heartbeat exposes version + environment so QA can confirm the deployment targeted in the PRD (Section 1 Overview)."
        ),
        make_request(
            "Permissions Matrix",
            "GET",
            "{{base_url}}/permissions",
            "Lists role -> permissions as assembled by utils/permissions.listPermissions enabling HO to verify RBAC before onboarding branches."
        ),
        make_request(
            "System Metrics",
            "GET",
            "{{base_url}}/system-metrics",
            "Protected endpoint behind requirePermission('metrics:view') reporting uptime, requestCount, and errorCount (ties to PRD Objective: real-time visibility).",
            auth=True
        )
    ]
}
collection["item"].append(platform_folder)

auth_folder = {
    "name": "01 · Authentication & Access Control",
    "description": "PRD Section 4.1 describes HO vs BR sign-in, password recovery, and token revocation. All routes live in server/src/routes/authRoutes.js.",
    "item": [
        make_request(
            "Register Staff User",
            "POST",
            "{{base_url}}/auth/register",
            "HO/admin-only (protect + authorizeHO downstream) to fulfill PRD requirement that HO provisions branch operators and assigns credentials.",
            auth=True,
            body={
                "name": "Head Office Admin",
                "email": "admin@dominion.test",
                "password": "SecurePass123!",
                "role": "HO",
                "branch": "{{BRANCH_ID}}"
            },
            content_type=True
        ),
        make_request(
            "Login",
            "POST",
            "{{base_url}}/auth/login",
            "BR or HO login with username/email + password. authSchemas.login enforces password + one identifier (PRD 4.1).",
            body={
                "email": "admin@dominion.test",
                "password": "SecurePass123!"
            },
            content_type=True
        ),
        make_request(
            "Forgot Password",
            "POST",
            "{{base_url}}/auth/forgot-password",
            "Brevo email is triggered for HO notification when a branch requests access (PRD Email Notifications).",
            body={"email": "admin@dominion.test"},
            content_type=True
        ),
        make_request(
            "Reset Password",
            "PUT",
            "{{base_url}}/auth/reset-password/{{RESET_TOKEN}}",
            "Completes the recovery flow with authSchemas.reset enforcing new password >= 8 chars.",
            body={"password": "NewSecurePass456!"},
            content_type=True
        ),
        make_request(
            "Logout & Revoke JWT",
            "POST",
            "{{base_url}}/auth/logout",
            "Revokes the active token by hashing into RevokedToken collection; keeps HO compliant with PRD security controls.",
            auth=True
        ),
        make_request(
            "Current User Profile",
            "GET",
            "{{base_url}}/auth/me",
            "Returns populated user including branch, permissions, lastLogin, fulfilling PRD requirement for real-time visibility per role.",
            auth=True
        )
    ]
}
collection["item"].append(auth_folder)

ho_setup_folder = {
    "name": "02 · Head Office Setup & Configuration",
    "description": "Aligns with PRD sections 4 & 5 where HO owns branch profiles, user provisioning, and control fields/notifications.",
    "item": []
}

branch_profiles = {
    "name": "2.1 Branch Profiles",
    "description": "server/src/routes/branchRoutes.js guarded by requirePermission('branch:*'). Enables HO duties: create, activate/deactivate, manage codes.",
    "item": [
        make_request(
            "List Branches",
            "GET",
            "{{base_url}}/branches?search=Lagos&page=1&limit=50",
            "Supports search/pagination so HO can audit all BR entities (PRD 3 & 4).",
            auth=True
        ),
        make_request(
            "Create Branch",
            "POST",
            "{{base_url}}/branches",
            "Implements PRD statement that HO creates branch profiles including manager assignments and limits.",
            auth=True,
            body={
                "name": "Lagos Central",
                "code": "LG001",
                "address": "23 Marina, Lagos",
                "phone": "+234-800-111-0000",
                "email": "lagos@dominion.test",
                "manager": "{{USER_ID}}",
                "operationHours": "08:00-17:00",
                "dailyLimit": 5000000
            },
            content_type=True
        ),
        make_request(
            "Get Branch",
            "GET",
            "{{base_url}}/branches/{{BRANCH_ID}}",
            "Allows HO to inspect profile, manager, and status per PRD oversight objectives.",
            auth=True
        ),
        make_request(
            "Update Branch",
            "PUT",
            "{{base_url}}/branches/{{BRANCH_ID}}",
            "HO can edit branch contact, manager, or limits (PRD 3).",
            auth=True,
            body={
                "phone": "+234-800-222-0000",
                "status": "active"
            },
            content_type=True
        ),
        make_request(
            "Toggle Branch Status",
            "PATCH",
            "{{base_url}}/branches/{{BRANCH_ID}}/toggle-status",
            "Matches PRD requirement for activating/deactivating branches.",
            auth=True
        ),
        make_request(
            "Delete Branch",
            "DELETE",
            "{{base_url}}/branches/{{BRANCH_ID}}",
            "Only possible when no users remain; enforces data integrity for HO administrators.",
            auth=True
        )
    ]
}

user_provisioning = {
    "name": "2.2 User Provisioning",
    "description": "server/src/routes/usersRoutes.js (protect + authorizeHO) giving HO the ability to assign usernames/passwords per PRD Section 4.",
    "item": [
        make_request(
            "List Users",
            "GET",
            "{{base_url}}/users?page=1&limit=25&role=BR&status=active",
            "Filters allow HO to audit branch operators, ensuring accountability mandated by PRD objectives.",
            auth=True
        ),
        make_request(
            "Create User",
            "POST",
            "{{base_url}}/users",
            "HO issues credentials referencing branch ID, fulfilling the onboarding flow described in the PRD.",
            auth=True,
            body={
                "username": "branch.user01",
                "email": "branch.user01@dominion.test",
                "password": "BranchPass123!",
                "role": "BR",
                "branchId": "{{BRANCH_ID}}"
            },
            content_type=True
        ),
        make_request(
            "Update User",
            "PUT",
            "{{base_url}}/users/{{USER_ID}}",
            "Allows HO to rotate roles or branch assignments when branches reorganize.",
            auth=True,
            body={
                "role": "manager",
                "status": "active",
                "branchId": "{{BRANCH_ID}}"
            },
            content_type=True
        ),
        make_request(
            "Delete User",
            "DELETE",
            "{{base_url}}/users/{{USER_ID}}",
            "Removes staff as part of governance and audit readiness.",
            auth=True
        )
    ]
}

system_config = {
    "name": "2.3 System Configuration",
    "description": "HO-only settings (server/src/routes/settingsRoutes.js) capturing PRD control fields such as currency, interest rates, and notifications.",
    "item": [
        make_request("Get System Settings", "GET", "{{base_url}}/settings/system", "Retrieves metadata (app name, currency) referenced in PRD Overview.", auth=True),
        make_request(
            "Update System Settings",
            "PUT",
            "{{base_url}}/settings/system",
            "HO configures company details, max daily transaction limits, and audit toggles as described under PRD objectives.",
            auth=True,
            body={
                "appName": "Dominion Ops",
                "companyName": "Dominion Holdings",
                "defaultCurrency": "NGN",
                "sessionTimeoutMinutes": 30,
                "auditTrailEnabled": True
            },
            content_type=True
        ),
        make_request("Get Financial Settings", "GET", "{{base_url}}/settings/financial", "Includes interest rates, loan max, withdrawal limits aligning with PRD finance logic.", auth=True),
        make_request(
            "Update Financial Settings",
            "PUT",
            "{{base_url}}/settings/financial",
            "HO maintains default rates and penalties used in cashbook formulas.",
            auth=True,
            body={
                "defaultLoanInterestRate": 3.25,
                "savingsInterestRate": 1.1,
                "processingFeePercentage": 0.5,
                "minimumSavingsAmount": 500,
                "transactionApprovalsEnabled": True
            },
            content_type=True
        ),
        make_request("Get Security Settings", "GET", "{{base_url}}/settings/security", "Displays password policy and 2FA toggles supporting PRD security criteria.", auth=True),
        make_request(
            "Update Security Settings",
            "PUT",
            "{{base_url}}/settings/security",
            "HO enforces password complexity, lockout timers, and login attempt limits (PRD Acceptance Criteria).",
            auth=True,
            body={
                "minPasswordLength": 10,
                "passwordRequirements": {
                    "uppercase": True,
                    "lowercase": True,
                    "numbers": True,
                    "specialChars": True
                },
                "twoFactorAuthEnabled": True,
                "loginAttemptLimit": 5,
                "accountLockoutMinutes": 30
            },
            content_type=True
        ),
        make_request("Get Notification Settings", "GET", "{{base_url}}/settings/notifications", "Shows recipients/report schedule supporting PRD email alerts when branches log in.", auth=True),
        make_request(
            "Update Notification Settings",
            "PUT",
            "{{base_url}}/settings/notifications",
            "HO configures Brevo recipients and SMS gateways as part of PRD notification flows.",
            auth=True,
            body={
                "emailNotifications": {
                    "dailyReports": True,
                    "lowBalanceAlerts": True,
                    "transactionAlerts": False,
                    "systemMaintenance": True
                },
                "reportSchedule": "weekly",
                "recipients": ["opslead@dominion.test", "compliance@dominion.test"],
                "smsGateway": "twilio"
            },
            content_type=True
        )
    ]
}

ho_setup_folder["item"].extend([branch_profiles, user_provisioning, system_config])
collection["item"].append(ho_setup_folder)

branch_runbook = {
    "name": "03 · Branch Daily Runbook",
    "description": "End-to-end BR workflow from PRD Section 5: capture Cashbook 1 & 2, sync ledgers, submit daily ops, and project next day.",
    "item": []
}

step1_cashbook = {
    "name": "Step 1 · Capture Cashbook",
    "description": "server/src/routes/cashbookRoutes.js implements PRD tables 5.1 & 5.2 (Cashbook 1 & 2).",
    "item": [
        make_request(
            "List Entries",
            "GET",
            "{{base_url}}/cashbook?page=1&limit=25&type=income&status=pending&branch={{BRANCH_ID}}&startDate={{REPORT_START}}&endDate={{REPORT_END}}",
            "BR reviews previously submitted rows; HO/Managers can review for approvals.",
            auth=True
        ),
        make_request(
            "Create Entry",
            "POST",
            "{{base_url}}/cashbook",
            "Branch inputs numeric-only PCIH, Savings, Loan Collection, Charges, etc., matching PRD Cashbook 1 description.",
            auth=True,
            body={
                "type": "income",
                "category": "Daily savings",
                "description": "Client deposits",
                "amount": 125000.5,
                "paymentMethod": "cash",
                "reference": "CBK-20251127-001",
                "date": "{{REPORT_END}}",
                "notes": "Captured by branch user"
            },
            content_type=True
        ),
        make_request(
            "Get Entry",
            "GET",
            "{{base_url}}/cashbook/{{CASHBOOK_ID}}",
            "Returns BR entry with derived flags isSubmitted/submittedAt for review.",
            auth=True
        ),
        make_request(
            "Update Entry",
            "PUT",
            "{{base_url}}/cashbook/{{CASHBOOK_ID}}",
            "Same-day edits allowed before cutoff, satisfying PRD requirement to edit before submission window closes.",
            auth=True,
            body={
                "amount": 130000,
                "paymentMethod": "transfer",
                "notes": "Adjusted before submission"
            },
            content_type=True
        ),
        make_request(
            "Delete Entry",
            "DELETE",
            "{{base_url}}/cashbook/{{CASHBOOK_ID}}",
            "Branch can delete same-day pending entries per PRD editing rules.",
            auth=True
        ),
        make_request(
            "Approve or Reject Entry",
            "PATCH",
            "{{base_url}}/cashbook/{{CASHBOOK_ID}}/status",
            "Managers/HO finalize entries, enabling HO oversight of branch submissions.",
            auth=True,
            body={
                "status": "approved",
                "notes": "Reviewed by HO"
            },
            content_type=True
        ),
        make_request(
            "Summary Snapshot",
            "GET",
            "{{base_url}}/cashbook/reports/summary?branch={{BRANCH_ID}}&startDate={{REPORT_START}}&endDate={{REPORT_END}}",
            "Aggregated totals correspond to PRD auto-compute requirement (Cashbook totals).",
            auth=True
        ),
        make_request(
            "Compatibility Cashbook Route",
            "GET",
            "{{base_url}}/cashbook/{{BRANCH_ID}}/{{REPORT_END}}",
            "Legacy GET /cashbook/:branchId/:date maintained for earlier mobile clients while mapping to same list handler.",
            auth=True
        )
    ]
}

step2_ledgers = {
    "name": "Step 2 · Sync Bank & Ledgers",
    "description": "Covers PRD sections 5.3–5.10 (Loan Register, Savings Register, Bank Statements, Disbursement Roll).",
    "item": [
        make_request(
            "Loan Register (Daily)",
            "GET",
            "{{base_url}}/registers/loan?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Reflects formula: previousLoanTotal (HO input) + disbursement with interest - loan collection.",
            auth=True
        ),
        make_request(
            "Savings Register (Daily)",
            "GET",
            "{{base_url}}/registers/savings?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Implements PRD savings logic: savings intake + previous total - withdrawals.",
            auth=True
        ),
        make_request(
            "Bank Statement 1",
            "GET",
            "{{base_url}}/bank-statements/bs1?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Maps FRM HO/BR + DOMI BANK/POS/T into BS1 TOTAL as defined in PRD 5.7.",
            auth=True
        ),
        make_request(
            "Bank Statement 2",
            "GET",
            "{{base_url}}/bank-statements/bs2?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Shows WITHD, T.B.O, EX AMT, EX PURPOSE, BS2 TOTAL (PRD 5.8).",
            auth=True
        ),
        make_request(
            "Disbursement Roll",
            "GET",
            "{{base_url}}/disbursement-roll?month={{MONTH}}&year={{YEAR}}&branchId={{BRANCH_ID}}",
            "Summarizes monthly disbursement flow = previousDisbursement + daily DIS AMT (PRD 5.10).",
            auth=True
        )
    ]
}

step3_ops = {
    "name": "Step 3 · Submit Daily Operations",
    "description": "server/src/routes/operationsRoutes.js orchestrates entire bundle (Cashbook1/2, predictions, registers) per PRD objectives.",
    "item": [
        make_request(
            "Get Daily Operations",
            "GET",
            "{{base_url}}/operations/daily?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Branch reviews aggregated record before submission.",
            auth=True
        ),
        make_request(
            "Create or Update Daily Ops",
            "POST",
            "{{base_url}}/operations/daily",
            "BR inputs numeric payload (pcih, savings, disAmt, predictionNo, exAmt, etc.) as a single operation per PRD step.",
            auth=True,
            body={
                "date": "{{REPORT_END}}",
                "pcih": 150000,
                "savings": 250000,
                "loanCollection": 180000,
                "chargesCollection": 22000,
                "disNo": 12,
                "disAmt": 900000,
                "disWithInt": 950000,
                "savWith": 120000,
                "domiBank": 30000,
                "posT": 50000,
                "predictionNo": 40,
                "predictionAmount": 350000,
                "exAmt": 15000,
                "exPurpose": "Generator fuel"
            },
            content_type=True
        ),
        make_request(
            "Submit Daily Ops",
            "PATCH",
            "{{base_url}}/operations/daily/{{DAILY_OPS_ID}}/submit",
            "Locks the record (isCompleted/submittedAt) so HO can trust data before dashboards update (PRD 6.1).",
            auth=True
        ),
        make_request(
            "List All Daily Ops",
            "GET",
            "{{base_url}}/operations/all?branchId={{BRANCH_ID}}",
            "Aggregated list powers HO oversight and branch history.",
            auth=True
        ),
        make_request(
            "Operations History",
            "GET",
            "{{base_url}}/operations/history?page=1&limit=20&startDate={{REPORT_START}}&endDate={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Provides paginated history fulfilling PRD requirement for reconciliation between HO and branches.",
            auth=True
        )
    ]
}

step4_prediction = {
    "name": "Step 4 · Next-Day Projection",
    "description": "Implements PRD section 5.6 so branches forecast next-day disbursements.",
    "item": [
        make_request(
            "Get Prediction",
            "GET",
            "{{base_url}}/prediction?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Defaults to tomorrow when date omitted; supports BR review of expected next-day disbursements.",
            auth=True
        ),
        make_request(
            "Create or Update Prediction",
            "POST",
            "{{base_url}}/prediction",
            "BR or admin logs PREDICTION NO/AMOUNT to satisfy PRD forecasting requirements.",
            auth=True,
            body={
                "predictionNo": 45,
                "predictionAmount": 375000,
                "predictionDate": "2025-11-28",
                "branchId": "{{BRANCH_ID}}"
            },
            content_type=True
        )
    ]
}

branch_runbook["item"].extend([step1_cashbook, step2_ledgers, step3_ops, step4_prediction])
collection["item"].append(branch_runbook)

ho_controls = {
    "name": "04 · Head Office Controls",
    "description": "PRD emphasizes HO-only control fields (FRM HO/BR, T.B.O, previous totals). These requests let HO adjust those values after submission.",
    "item": [
        make_request(
            "Update HO Fields (Daily Ops)",
            "PATCH",
            "{{base_url}}/operations/ho-fields",
            "authorizeHO enforces HO ownership of FRM HO/BR, TBO, previous totals, satisfying PRD requirement that branches cannot edit these fields.",
            auth=True,
            body={
                "branchId": "{{BRANCH_ID}}",
                "date": "{{REPORT_END}}",
                "frmHO": 100000,
                "frmBR": 75000,
                "tbo": 50000,
                "tboTargetBranch": "{{TBO_TARGET_BRANCH}}",
                "previousLoanTotal": 5500000,
                "previousSavingsTotal": 7200000,
                "previousDisbursement": 1500000,
                "loanMultiplier": 1.2
            },
            content_type=True
        ),
        make_request(
            "Update Register Previous Totals",
            "PATCH",
            "{{base_url}}/registers/previous",
            "HO/admin adjusts previousLoanTotal, previousSavingsTotal, loanMultiplier ahead of next reporting cycle.",
            auth=True,
            body={
                "branchId": "{{BRANCH_ID}}",
                "previousLoanTotal": 5200000,
                "previousSavingsTotal": 7100000,
                "loanMultiplier": 1.15
            },
            content_type=True
        ),
        make_request(
            "Update T.B.O",
            "PATCH",
            "{{base_url}}/bank-statements/bs2/tbo",
            "HO updates Transfer Between Offices plus target branch reference for PRD section 5.8.",
            auth=True,
            body={
                "branchId": "{{BRANCH_ID}}",
                "date": "{{REPORT_END}}",
                "tbo": 45000,
                "tboTargetBranch": "{{TBO_TARGET_BRANCH}}"
            },
            content_type=True
        ),
        make_request(
            "Update Previous Disbursement",
            "PATCH",
            "{{base_url}}/disbursement-roll/previous",
            "HO/admin sets baseline monthly disbursement figures referenced in PRD 5.10.",
            auth=True,
            body={
                "branchId": "{{BRANCH_ID}}",
                "previousDisbursement": 1250000
            },
            content_type=True
        )
    ]
}
collection["item"].append(ho_controls)

dashboards_folder = {
    "name": "05 · Dashboards & KPIs",
    "description": "PRD Section 6 requires real-time dashboards for both BR and HO including CIH/TSO metrics.",
    "item": [
        make_request(
            "Branch Dashboard",
            "GET",
            "{{base_url}}/dashboard/branch?branchId={{BRANCH_ID}}&startDate={{REPORT_START}}&endDate={{REPORT_END}}",
            "BR (or admin) views 30-day trend, todayOperations, CIH, BS1/BS2, prediction, fulfilling PRD 6.1.",
            auth=True
        ),
        make_request(
            "Head Office Dashboard",
            "GET",
            "{{base_url}}/dashboard/ho?startDate={{REPORT_START}}&endDate={{REPORT_END}}",
            "HO-level overview across branches with ability to drill down, per PRD 6.2.",
            auth=True
        ),
        make_request(
            "Online CIH & TSO",
            "GET",
            "{{base_url}}/metrics/online-cih-tso?date={{REPORT_END}}",
            "MetricsService.dailyOnlineCIHTSO aggregates CIH/TSO per branch, matching PRD 5.3 & 5.9 visibility requirements.",
            auth=True
        )
    ]
}
collection["item"].append(dashboards_folder)

reports_folder = {
    "name": "06 · Reports & Analytics",
    "description": "PRD Section 7 (Daily, Monthly, HO Consolidated) plus compatibility /reports/financial. All routes sit behind protect + requirePermission with reportsLimiter (10 req/min) and exportLimiter (5/min).",
    "item": []
}

reports_daily = {
    "name": "Daily Branch Reports",
    "description": "ReportsService.daily + export counterpart.",
    "item": [
        make_request(
            "Daily Report",
            "GET",
            "{{base_url}}/reports/daily?date={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Provides operations, cashbook breakdowns, and computed CIH/TSO per PRD 7.",
            auth=True
        ),
        make_request(
            "Daily Report Export",
            "GET",
            "{{base_url}}/reports/daily/export?date={{REPORT_END}}&branchId={{BRANCH_ID}}&format=excel",
            "Streams Excel (default) or PDF; subject to exportLimiter (5 req/min per user).",
            auth=True
        )
    ]
}

reports_monthly = {
    "name": "Monthly Summary",
    "description": "ReportsService.monthly plus export covering savings/loan movement and disbursement roll aggregation.",
    "item": [
        make_request(
            "Monthly Report",
            "GET",
            "{{base_url}}/reports/monthly?month={{MONTH}}&year={{YEAR}}&branchId={{BRANCH_ID}}",
            "Reports month-to-date totals, register movement, and disbursement roll entries.",
            auth=True
        ),
        make_request(
            "Monthly Report Export",
            "GET",
            "{{base_url}}/reports/monthly/export?month={{MONTH}}&year={{YEAR}}&branchId={{BRANCH_ID}}&format=pdf",
            "Export version for HO distribution (Excel default, PDF optional).",
            auth=True
        )
    ]
}

reports_consolidated = {
    "name": "HO Consolidated",
    "description": "HO-only consolidated view referenced in PRD 7.",
    "item": [
        make_request(
            "Consolidated Report",
            "GET",
            "{{base_url}}/reports/consolidated?startDate={{REPORT_START}}&endDate={{REPORT_END}}",
            "Requires reports:consolidated + HO/admin role to aggregate all branches.",
            auth=True
        ),
        make_request(
            "Consolidated Report Export",
            "GET",
            "{{base_url}}/reports/consolidated/export?startDate={{REPORT_START}}&endDate={{REPORT_END}}&format=excel",
            "Excel/PDF export for board-ready reporting.",
            auth=True
        )
    ]
}

reports_custom = {
    "name": "Custom & Legacy",
    "description": "Advanced filters + compatibility endpoint for legacy clients still calling /reports/financial.",
    "item": [
        make_request(
            "Custom Report",
            "GET",
            "{{base_url}}/reports/custom?startDate={{REPORT_START}}&endDate={{REPORT_END}}&branchIds={{BRANCH_ID}},{{TBO_TARGET_BRANCH}}&reportType=summary&groupBy=branch",
            "Supports PRD requirement to eliminate Excel by giving HO flexible aggregations.",
            auth=True
        ),
        make_request(
            "Custom Report Export",
            "GET",
            "{{base_url}}/reports/custom/export?startDate={{REPORT_START}}&endDate={{REPORT_END}}&branchIds={{BRANCH_ID}},{{TBO_TARGET_BRANCH}}&reportType=summary&groupBy=branch&format=excel",
            "Exports the same aggregation via Excel/PDF.",
            auth=True
        ),
        make_request(
            "Financial Report (Compatibility)",
            "GET",
            "{{base_url}}/reports/financial?startDate={{REPORT_START}}&endDate={{REPORT_END}}&branchId={{BRANCH_ID}}",
            "Maintains original contract from early PRD iterations by mapping to ReportsService.custom and reshaping payload.",
            auth=True
        )
    ]
}

reports_folder["item"].extend([reports_daily, reports_monthly, reports_consolidated, reports_custom])
collection["item"].append(reports_folder)

compliance_folder = {
    "name": "07 · Compliance & Monitoring",
    "description": "PRD acceptance criteria call out auditability and monitoring. These routes cover audit logs plus API telemetry.",
    "item": [
        make_request(
            "List Audit Logs",
            "GET",
            "{{base_url}}/audit-logs?startDate={{REPORT_START}}&endDate={{REPORT_END}}&userId={{USER_ID}}&action=user.update&page=1&limit=50",
            "HO-only (authorizeHO) view into log trail for every CRUD action with pagination up to 200 entries.",
            auth=True
        )
    ]
}
collection["item"].append(compliance_folder)

path = Path('api/postman_collection.json')
path.write_text(json.dumps(collection, indent=2) + '\n')
