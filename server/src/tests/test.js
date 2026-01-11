import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import ReportsService from '../services/ReportsService.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import BankStatement1 from '../models/BankStatement1.js';
import BankStatement2 from '../models/BankStatement2.js';
import LoanRegister from '../models/LoanRegister.js';
import SavingsRegister from '../models/SavingsRegister.js';
import DailyOperations from '../models/DailyOperations.js';

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });
afterEach(async () => { await clearDatabase(); });

async function seedDaily(branch) {
  const user = await User.create({ name: 'RepUser', email: 'rep@test.com', password: 'Passw0rd!', role: 'BR', branch: branch._id });
  const date = new Date();
  const cb1 = await Cashbook1.create({ branch: branch._id, user: user._id, pcih: 50, savings: 100, loanCollection: 40, chargesCollection: 10 });
  const cb2 = await Cashbook2.create({ branch: branch._id, user: user._id, disNo: 1, disAmt: 30, disWithInt: 35, savWith: 20, domiBank: 15, posT: 5 });
  const bs1 = await BankStatement1.create({ branch: branch._id, recHO: cb1.frmHO, recBO: cb1.frmBR, domi: cb2.domiBank, pa: cb2.posT });
  const bs2 = await BankStatement2.create({ branch: branch._id, user: user._id, withd: cb1.frmHO, tbo: 0, exAmt: 0 });
  const lr = await LoanRegister.create({ branch: branch._id, previousLoanTotal: branch.previousLoanTotal, loanDisbursementWithInterest: cb2.disWithInt, loanCollection: cb1.loanCollection });
  const sr = await SavingsRegister.create({ branch: branch._id, previousSavingsTotal: branch.previousSavingsTotal, savings: cb1.savings, savingsWithdrawal: cb2.savWith });
  const daily = await DailyOperations.create({ branch: branch._id, user: user._id, date, cashbook1: cb1._id, cashbook2: cb2._id, bankStatement1: bs1._id, bankStatement2: bs2._id, loanRegister: lr._id, savingsRegister: sr._id, onlineCIH: cb1.cbTotal1 - cb2.cbTotal2, tso: bs1.bs1Total - bs2.bs2Total });
  return { user, daily };
}

test('ReportsService.daily returns expected structure', async () => {
  const branch = await Branch.create({ name: 'Rep Branch', code: 'RB1', previousLoanTotal: 100, previousSavingsTotal: 200 });
  await seedDaily(branch);
  const req = { query: {}, user: { role: 'HO', name: 'HO User' } };
  const report = await ReportsService.daily(req);
  expect(report.operations).toHaveLength(1);
  const op = report.operations[0];
  expect(op.branch.name).toBe('Rep Branch');
  expect(op.cashbook1.savings).toBe(100);
  expect(op.cashbook2.disAmt).toBe(30);
  expect(op.calculated.onlineCIH).toBeDefined();
});

test('ReportsService.monthly returns correct monthly disbursement rollup', async () => {
  const branch = await Branch.create({ name: 'Monthly Branch', code: 'MB1', previousLoanTotal: 100, previousSavingsTotal: 200 });
  const user = await User.create({ name: 'BR User', email: 'bruser@test.com', password: 'Passw0rd!', role: 'BR', branch: branch._id });
  const date1 = new Date(2026, 0, 1);
  const date2 = new Date(2026, 0, 2);
  const cb1a = await Cashbook1.create({ branch: branch._id, user: user._id, date: date1, savings: 10, loanCollection: 5, chargesCollection: 2 });
  const cb2a = await Cashbook2.create({ branch: branch._id, user: user._id, date: date1, disNo: 1, disAmt: 100 });
  await DailyOperations.create({ branch: branch._id, user: user._id, date: date1, cashbook1: cb1a._id, cashbook2: cb2a._id });
  const cb1b = await Cashbook1.create({ branch: branch._id, user: user._id, date: date2, savings: 20, loanCollection: 10, chargesCollection: 4 });
  const cb2b = await Cashbook2.create({ branch: branch._id, user: user._id, date: date2, disNo: 2, disAmt: 200 });
  await DailyOperations.create({ branch: branch._id, user: user._id, date: date2, cashbook1: cb1b._id, cashbook2: cb2b._id });
  const req = { query: { month: 1, year: 2026 }, user: { role: 'HO', name: 'HO User' } };
  const report = await ReportsService.monthly(req);
  expect(report.monthlySummary.length).toBeGreaterThan(0);
  expect(report.disbursementRolls.length).toBe(2);
  expect(report.disbursementRolls[0].disAmt + report.disbursementRolls[1].disAmt).toBe(600); // 2*300 (each roll sums all branch ops)
});

test('ReportsService.aggregateMonthlySummary returns correct structure', async () => {
  const branch = await Branch.create({ name: 'Agg Branch', code: 'AG1', previousLoanTotal: 100, previousSavingsTotal: 200 });
  await seedDaily(branch);
  const query = { branch: branch._id };
  const summary = await ReportsService.aggregateMonthlySummary(query);
  expect(Array.isArray(summary)).toBe(true);
  expect(summary[0]).toHaveProperty('branchName');
  expect(summary[0]).toHaveProperty('totalDisbursements');
});

test('ReportsService.aggregateRegisterMovement returns correct structure', async () => {
  const branch = await Branch.create({ name: 'Reg Branch', code: 'REG1', previousLoanTotal: 100, previousSavingsTotal: 200 });
  await seedDaily(branch);
  const query = { branch: branch._id };
  const movement = await ReportsService.aggregateRegisterMovement(query);
  expect(Array.isArray(movement)).toBe(true);
  expect(movement[0]).toHaveProperty('branchName');
  expect(movement[0]).toHaveProperty('openingLoanBalance');
});

test('ReportsService.consolidated returns consolidated report', async () => {
  const branch = await Branch.create({ name: 'Con Branch', code: 'CB1', previousLoanTotal: 100, previousSavingsTotal: 200 });
  await seedDaily(branch);
  const req = { query: {}, user: { role: 'HO', name: 'HO User' } };
  const report = await ReportsService.consolidated(req);
  expect(report).toHaveProperty('consolidatedData');
  expect(report).toHaveProperty('grandTotals');
  expect(report).toHaveProperty('currentRegisters');
});

test('ReportsService.fetchDisbursementRolls returns array', async () => {
  const branch = await Branch.create({ name: 'Disb Branch', code: 'DB1', previousLoanTotal: 100, previousSavingsTotal: 200 });
  // No rolls seeded, should return empty array
  const req = { user: { role: 'HO', name: 'HO User' } };
  const rolls = await ReportsService.fetchDisbursementRolls(req, 1, 2026, branch._id);
  expect(Array.isArray(rolls)).toBe(true);
});