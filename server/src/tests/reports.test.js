import request from 'supertest';
import app from '../app.js';
import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  await connect();
});

afterAll(async () => { await closeDatabase(); });

afterEach(async () => { await clearDatabase(); });

async function seedDaily(branch, user) {
  const date = new Date();
  const cb1 = await Cashbook1.create({ branch: branch._id, user: user._id, date, pcih: 10, savings: 5, loanCollection: 3, chargesCollection: 2 });
  const cb2 = await Cashbook2.create({ branch: branch._id, user: user._id, date, disNo: 1, disAmt: 4, disWithInt: 1, savWith: 2, domiBank: 1, posT: 1 });
  const daily = await DailyOperations.create({ branch: branch._id, user: user._id, date, cashbook1: cb1._id, cashbook2: cb2._id, onlineCIH: 20, tso: 6 });
  return daily;
}

describe('Reports endpoints', () => {
  test('daily and monthly reports respond with success', async () => {
    const branch = await Branch.create({ name: 'BranchA', code: 'BA' });
    const ho = await User.create({ name: 'HO', email: 'ho@example.com', password: 'Passw0rd!', role: 'HO' });
    const br = await User.create({ name: 'BR', email: 'br@example.com', password: 'Passw0rd!', role: 'BR', branch: branch._id });
    await seedDaily(branch, br);

    // HO login for token
    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'ho@example.com', password: 'Passw0rd!' });
    const token = loginRes.body.data.token;

    const dailyReport = await request(app).get('/api/v1/reports/daily').set('Authorization', `Bearer ${token}`);
    expect(dailyReport.status).toBe(200);
    expect(dailyReport.body.success).toBe(true);

    const monthlyReport = await request(app).get('/api/v1/reports/monthly').set('Authorization', `Bearer ${token}`);
    expect(monthlyReport.status).toBe(200);
    expect(monthlyReport.body.success).toBe(true);
  });
});
