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

test.skip('ReportsService.daily returns expected structure', async () => {
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
