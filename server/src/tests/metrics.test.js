import request from 'supertest';
import app from '../app.js';
import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  await connect();
});

afterAll(async () => { await closeDatabase(); });

afterEach(async () => { await clearDatabase(); });

async function seed(branch, user) {
  const date = new Date();
  const cb1 = await Cashbook1.create({ branch: branch._id, user: user._id, date, pcih: 50, savings: 20, loanCollection: 10, chargesCollection: 5 });
  const cb2 = await Cashbook2.create({ branch: branch._id, user: user._id, date, disNo: 1, disAmt: 15, disWithInt: 3, savWith: 4, domiBank: 2, posT: 1 });
  await DailyOperations.create({ branch: branch._id, user: user._id, date, cashbook1: cb1._id, cashbook2: cb2._id, onlineCIH: 100, tso: 30 });
}

describe('Metrics endpoint', () => {
  test('online-cih-tso returns metrics array', async () => {
    const branch = await Branch.create({ name: 'BranchX', code: 'BX' });
    const ho = await User.create({ name: 'HO', email: 'ho@example.com', password: 'Passw0rd!', role: 'HO' });
    const br = await User.create({ name: 'BR', email: 'br@example.com', password: 'Passw0rd!', role: 'BR', branch: branch._id });
    await seed(branch, br);

    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'ho@example.com', password: 'Passw0rd!' });
    const token = loginRes.body.data.token;

    const metricsRes = await request(app)
      .get('/api/v1/metrics/online-cih-tso')
      .set('Authorization', `Bearer ${token}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.success).toBe(true);
    expect(Array.isArray(metricsRes.body.data.metrics)).toBe(true);
  });
});
