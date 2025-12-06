# Field-Level Permissions & Routes Mapping

This document maps PRD features to routes, models, calculated formulas, and who can view/edit each field.

## 1. Current Branch Register (Loan)

Model: `LoanRegister`

Formula: `currentLoanBalance = (previousLoanTotal * loanMultiplier) + loanDisbursementWithInterest - loanCollection`

Routes:

- GET `/api/v1/registers/loan` (permission: `registers:view`)
- PATCH `/api/v1/registers/previous` (permission: `registers:modify`) — update `previousLoanTotal`, `loanMultiplier`

Fields:

- previousLoanTotal (HO/admin edit) | view: BR/HO
- loanMultiplier (HO/admin edit) | view: BR/HO
- loanDisbursementWithInterest (from Cashbook2.disWithInt, BR input) | view: BR/HO
- loanCollection (from Cashbook1.loanCollection, BR input) | view: BR/HO
- currentLoanBalance (system) | view: BR/HO

## 2. Cashbook 1

Model: `Cashbook1`

Formula:

- `total = savings + loanCollection + chargesCollection`
- `cbTotal1 = pcih + savings + loanCollection + chargesCollection + frmHO + frmBR`

Routes (aggregate via daily ops & cashbook CRUD):

- GET `/api/v1/operations/daily` (permission: `operations:daily:view`)
- POST `/api/v1/operations/daily` (permission: `operations:daily:modify`)
- PATCH `/api/v1/operations/ho-fields` (HO only) update FRM HO/FRM BR

Fields:

- pcih, savings, loanCollection, chargesCollection (BR input) | view: BR/HO
- frmHO, frmBR (HO edit) | view: BR/HO
- total, cbTotal1 (system) | view: BR/HO

## 3. Cashbook 2

Model: `Cashbook2`

Formula: `cbTotal2 = disAmt + savWith + domiBank + posT`

Routes:

- Included in daily operations (same as Cashbook1)

Fields:

- disNo, disAmt, disWithInt, savWith, domiBank, posT (BR input) | view: BR/HO
- cbTotal2 (system) | view: BR/HO

## 4. ONLINE CIH

Stored in `DailyOperations.onlineCIH`

Formula: `onlineCIH = cbTotal1 - cbTotal2`

Routes:

- GET `/api/v1/operations/daily` (embedded)

View: BR/HO (system)

## Prediction

Model: `Prediction`

Fields: predictionNo, predictionAmount, predictionDate (BR input)

Routes:

- GET `/api/v1/prediction` (permission: `prediction:view`)
- POST `/api/v1/prediction` (permission: `prediction:modify`)

## 5. Bank Statement 1 (BS1)

Model: `BankStatement1`

Formula: `bs1Total = opening + recHO + recBO + domi + pa`

Routes:

- GET `/api/v1/bank-statements/bs1` (permission: `bankstatements:view`)

Fields:

- opening (default 0, BR may adjust) | view: BR/HO
- recHO, recBO (Cashbook1.frmHO/frmBR) | view: BR/HO
- domi (Cashbook2.domiBank), pa (Cashbook2.posT) | view: BR/HO
- bs1Total (system) | view: BR/HO

## 6. Bank Statement 2 (BS2)

Model: `BankStatement2`

Formula: `bs2Total = withd + tbo + exAmt`

Routes:

- GET `/api/v1/bank-statements/bs2` (permission: `bankstatements:view`)
- PATCH `/api/v1/bank-statements/bs2/tbo` (permission: `bankstatements:modify`) — HO sets T.B.O & target branch

Fields:

- withd (Cashbook1.frmHO) | view: BR/HO
- tbo, tboTargetBranch (HO edit) | view: BR/HO
- exAmt, exPurpose (BR input) | view: BR/HO
- bs2Total (system) | view: BR/HO

## 7. T.S.O

Stored in `DailyOperations.tso`

Formula: `tso = bs1Total - bs2Total`

Routes:

- GET `/api/v1/operations/daily` (embedded)

View: BR/HO

## 8. Disbursement Roll

Model: `DisbursementRoll`

Formula: `disbursementRoll = previousDisbursement + dailyDisbursement`

Routes:

- GET `/api/v1/disbursement-roll` (permission: `disbursement:view`)
- PATCH `/api/v1/disbursement-roll/previous` (permission: `disbursement:modify`)

Fields:

- previousDisbursement (HO edit) | view: BR/HO
- dailyDisbursement (system accumulated) | view: BR/HO
- disbursementRoll (system) | view: BR/HO

## 9. Savings Register

Model: `SavingsRegister`

Formula: `currentSavings = savings + previousSavingsTotal - savingsWithdrawal`

Routes:

- GET `/api/v1/registers/savings` (permission: `registers:view`)
- PATCH `/api/v1/registers/previous` (HO previous values update)

Fields:

- previousSavingsTotal (HO edit) | view: BR/HO
- savings (Cashbook1) (BR input) | view: BR/HO
- savingsWithdrawal (Cashbook2.savWith) (BR input) | view: BR/HO
- currentSavings (system) | view: BR/HO

## Role-Based Notification

Branch login email notification implemented in `AuthService.login` using Brevo.

## Permissions Added

Extended permissions in `src/utils/permissions.js`:

- registers:view|modify
- bankstatements:view|modify
- prediction:view|modify
- disbursement:view|modify

## Notes

All new controllers use simple date (day) bounding: [00:00, 24h). Improve with timezone awareness if needed.
Validation middleware can be added later; currently endpoints rely on minimal checks.
