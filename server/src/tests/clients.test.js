import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret-testsecret-test';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.NODE_ENV = 'test';

const mongoServer = await MongoMemoryServer.create();
process.env.TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || mongoServer.getUri();

import app from '../app.js';
import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
  await mongoServer.stop();
});

afterEach(async () => {
  await clearDatabase();
});

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Clients API', () => {
  test('should create a client with clientCategory and return it in list results', async () => {
    const branch = await Branch.create({ name: 'Lagos Mainland', code: 'LMB001' });
    const hoUser = await User.create({
      name: 'HO User',
      email: 'ho@test.com',
      password: 'Passw0rd!',
      role: 'HO',
      branch: branch._id
    });

    const token = generateToken(hoUser._id);
    const createPayload = {
      union: 'PRAISE THY LORD',
      clientName: 'FAVOUR HADASSAH',
      clientPhone: '08025000000',
      clientNickName: 'HADA',
      guarantorName: 'FAVOUR HADASSAH',
      guarantorPhone: '08025111111',
      guarantorNickName: 'HADA',
      partnerReferrerName: 'FAVOUR HADASSAH',
      partnerReferrerPhone: '08025222222',
      partnerReferrerNickName: 'HADA',
      status: 'active',
      clientCategory: 'loan_and_savings',
      branchId: branch._id.toString()
    };

    const createRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(createPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.client._id).toBeDefined();

    const listRes = await request(app)
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.clients)).toBe(true);
    expect(listRes.body.data.clients).toHaveLength(1);
    expect(listRes.body.data.clients[0].clientCategory).toBe('loan_and_savings');
  });

  test('should update clientCategory on existing client', async () => {
    const branch = await Branch.create({ name: 'Lagos Mainland', code: 'LMB001' });
    const hoUser = await User.create({
      name: 'HO User',
      email: 'ho@test.com',
      password: 'Passw0rd!',
      role: 'HO',
      branch: branch._id
    });

    const token = generateToken(hoUser._id);
    const createRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        union: 'PRAISE THY LORD',
        clientName: 'FAVOUR HADASSAH',
        clientPhone: '08025000000',
        clientNickName: 'HADA',
        guarantorName: 'FAVOUR HADASSAH',
        guarantorPhone: '08025111111',
        guarantorNickName: 'HADA',
        partnerReferrerName: 'FAVOUR HADASSAH',
        partnerReferrerPhone: '08025222222',
        partnerReferrerNickName: 'HADA',
        status: 'active',
        clientCategory: 'loan_only',
        branchId: branch._id.toString()
      });

    expect(createRes.status).toBe(201);
    const clientId = createRes.body.data.client._id;

    const updateRes = await request(app)
      .put(`/api/v1/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clientCategory: 'savings_only' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.client.clientCategory).toBe('savings_only');
  });

  test('should persist disbursementDate for create, fetch, and update flows', async () => {
    const branch = await Branch.create({ name: 'Lagos Mainland', code: 'LMB001' });
    const hoUser = await User.create({
      name: 'HO User',
      email: 'ho@test.com',
      password: 'Passw0rd!',
      role: 'HO',
      branch: branch._id
    });

    const token = generateToken(hoUser._id);
    const createRes = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        union: 'PRAISE THY LORD',
        clientName: 'FAVOUR HADASSAH',
        clientPhone: '08025000000',
        clientNickName: 'HADA',
        guarantorName: 'FAVOUR HADASSAH',
        guarantorPhone: '08025111111',
        guarantorNickName: 'HADA',
        partnerReferrerName: 'FAVOUR HADASSAH',
        partnerReferrerPhone: '08025222222',
        partnerReferrerNickName: 'HADA',
        status: 'active',
        disbursementDate: '2026-10-15',
        branchId: branch._id.toString()
      });

    expect(createRes.status).toBe(201);
    const clientId = createRes.body.data.client._id;

    const detailRes = await request(app)
      .get(`/api/v1/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(new Date(detailRes.body.data.client.disbursementDate).getTime()).toBe(new Date('2026-10-15T00:00:00.000Z').getTime());

    const updateRes = await request(app)
      .put(`/api/v1/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disbursementDate: '2026-11-20' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(new Date(updateRes.body.data.client.disbursementDate).getTime()).toBe(new Date('2026-11-20T00:00:00.000Z').getTime());
  });
});
