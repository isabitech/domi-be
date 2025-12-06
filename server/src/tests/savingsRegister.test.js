import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import SavingsRegister from '../models/SavingsRegister.js';
import Branch from '../models/Branch.js';

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });
afterEach(async () => { await clearDatabase(); });

test.skip('SavingsRegister calculates currentSavings correctly', async () => {
  const branch = await Branch.create({ name: 'Branch', code: 'B1', previousSavingsTotal: 300 });
  const sr = await SavingsRegister.create({ branch: branch._id, previousSavingsTotal: 300, savings: 200, savingsWithdrawal: 50 });
  expect(sr.currentSavings).toBe(200 + 300 - 50);
});
