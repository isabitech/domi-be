import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import OperationsService from '../services/OperationsService.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import DailyOperations from '../models/DailyOperations.js';

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });
afterEach(async () => { await clearDatabase(); });

function mockReq(userOverrides = {}, bodyOverrides = {}, queryOverrides = {}) {
  return {
    user: { id: userOverrides.id, role: userOverrides.role, branch: userOverrides.branch },
    body: bodyOverrides,
    query: queryOverrides
  };
}

test.skip('createOrUpdate computes onlineCIH and tso', async () => {
  const branch = await Branch.create({ name: 'Ops Branch', code: 'OP1', previousLoanTotal: 100, previousSavingsTotal: 50, previousDisbursement: 10 });
  const user = await User.create({ name: 'User', email: 'u@test.com', password: 'Passw0rd!', role: 'BR', branch: branch._id });
  const req = mockReq({ id: user._id.toString(), role: 'BR', branch: branch._id }, {
    pcih: 100, savings: 200, loanCollection: 50, chargesCollection: 10,
    disAmt: 30, disWithInt: 40, savWith: 20, domiBank: 15, posT: 5,
  });
  const result = await OperationsService.createOrUpdate(req);
  expect(result.onlineCIH).toBe((100 + 200 + 50 + 10) + 0 + 0 - (30 + 20 + 15 + 5)); // cbTotal1 - cbTotal2
  expect(result.tso).toBe(result.bankStatement1.bs1Total - result.bankStatement2.bs2Total);
});

test.skip('submit marks daily operations completed', async () => {
  const branch = await Branch.create({ name: 'Ops Branch', code: 'OP2', previousLoanTotal: 0, previousSavingsTotal: 0 });
  const user = await User.create({ name: 'User2', email: 'u2@test.com', password: 'Passw0rd!', role: 'BR', branch: branch._id });
  const req = mockReq({ id: user._id.toString(), role: 'BR', branch: branch._id }, { pcih: 10 });
  const daily = await OperationsService.createOrUpdate(req);
  const submitReq = { params: { id: daily._id }, user: { id: user._id.toString() } };
  const submitted = await OperationsService.submit(submitReq);
  expect(submitted.isCompleted).toBe(true);
  expect(submitted.submittedAt).toBeInstanceOf(Date);
});
