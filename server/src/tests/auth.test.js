import request from 'supertest';
import app from '../app.js';
import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import Branch from '../models/Branch.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '1d';
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

async function createBranch(name='Test Branch', code='TB') {
  return Branch.create({ name, code });
}

describe('Auth Flow', () => {
  test('register -> login -> me', async () => {
    const branch = await createBranch();
    // Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'Passw0rd!', role: 'BR', branch: branch._id.toString() });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    const token = registerRes.body.data.token;

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'Passw0rd!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();

    // Me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('alice@example.com');
  });
});
