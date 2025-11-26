import request from 'supertest';
import app from '../app.js';
import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import jwt from 'jsonwebtoken';

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });
afterEach(async () => { await clearDatabase(); });

function generateToken(userId) {
  // Use test JWT secret
  const testSecret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ id: userId }, testSecret, { expiresIn: '1h' });
}

describe('Operations Controller API', () => {
  let branchUser, hoUser, branch, brToken, hoToken;

  beforeEach(async () => {
    // Create test branch
    branch = await Branch.create({
      name: 'Test Branch',
      code: 'TB001',
      previousLoanTotal: 5000,
      previousSavingsTotal: 3000,
      previousDisbursement: 2000
    });

    // Create BR user
    branchUser = await User.create({
      name: 'Branch User',
      email: 'br@test.com',
      password: 'Passw0rd!',
      role: 'BR',
      branch: branch._id
    });

    // Create HO user  
    hoUser = await User.create({
      name: 'HO User',
      email: 'ho@test.com',
      password: 'Passw0rd!',
      role: 'HO',
      branch: branch._id
    });

    brToken = generateToken(branchUser._id);
    hoToken = generateToken(hoUser._id);
  });

  describe('POST /api/v1/operations/daily', () => {
    test('creates new daily operations successfully', async () => {
      const payload = {
        date: '2025-11-26T00:00:00.000Z',
        pcih: 1500.50,
        savings: 2500.75,
        loanCollection: 3000.00,
        chargesCollection: 250.25,
        disNo: 5,
        disAmt: 10000.00,
        disWithInt: 12000.00,
        savWith: 800.50,
        domiBank: 500.00,
        posT: 300.75,
        predictionNo: 3,
        predictionAmount: 8000.00,
        exAmt: 200.00,
        exPurpose: 'Office supplies'
      };

      const response = await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Daily operations saved');
      expect(response.body.data.dailyOps).toBeDefined();
      expect(response.body.data.dailyOps.cashbook1.pcih).toBe(1500.50);
      expect(response.body.data.dailyOps.cashbook2.disAmt).toBe(10000.00);
      expect(response.body.data.dailyOps.prediction.predictionNo).toBe(3);
    });

    test('updates existing daily operations for same date', async () => {
      const date = '2025-11-26T00:00:00.000Z';
      
      // First create
      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ date, pcih: 1000, savings: 500 })
        .expect(201);

      // Then update
      const response = await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ date, pcih: 1500, savings: 800, loanCollection: 2000 })
        .expect(201);

      expect(response.body.data.dailyOps.cashbook1.pcih).toBe(1500);
      expect(response.body.data.dailyOps.cashbook1.loanCollection).toBe(2000);
    });

    test('handles minimal payload', async () => {
      const response = await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ pcih: 1000 })
        .expect(201);

      expect(response.body.data.dailyOps.cashbook1.pcih).toBe(1000);
      expect(response.body.data.dailyOps.cashbook1.savings).toBe(0);
    });

    test('returns 403 for non-BR users', async () => {
      const response = await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${hoToken}`)
        .send({ pcih: 1000 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('returns 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/operations/daily')
        .send({ pcih: 1000 })
        .expect(401);
    });

    test('validates payload structure', async () => {
      const response = await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ pcih: -100 }) // Invalid negative value
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/operations/daily', () => {
    test('fetches daily operations for specific date', async () => {
      const date = '2025-11-26';
      
      // Create operations first
      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ date, pcih: 1000, savings: 500 });

      const response = await request(app)
        .get('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .query({ date })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.operations).toBeDefined();
      expect(response.body.data.operations.cashbook1.pcih).toBe(1000);
    });

    test('returns null for non-existent date', async () => {
      const response = await request(app)
        .get('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .query({ date: '2025-12-01' })
        .expect(200);

      expect(response.body.data.operations).toBeNull();
    });
  });

  describe('GET /api/v1/operations/all', () => {
    test('fetches all daily operations', async () => {
      // Create multiple operations
      const dates = ['2025-11-24', '2025-11-25', '2025-11-26'];
      for (const date of dates) {
        await request(app)
          .post('/api/v1/operations/daily')
          .set('Authorization', `Bearer ${brToken}`)
          .send({ date, pcih: 1000, savings: 500 });
      }

      const response = await request(app)
        .get('/api/v1/operations/all')
        .set('Authorization', `Bearer ${brToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.operations).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
    });

    test('filters by branch for BR users', async () => {
      // Create operations for current branch
      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ pcih: 1000 });

      const response = await request(app)
        .get('/api/v1/operations/all')
        .set('Authorization', `Bearer ${brToken}`)
        .expect(200);

      expect(response.body.data.operations).toHaveLength(1);
      expect(response.body.data.operations[0].branch._id).toBe(branch._id.toString());
    });
  });

  describe('PATCH /api/v1/operations/daily/:id/submit', () => {
    test('successfully submits daily operations', async () => {
      // Create operations first
      const createResponse = await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ pcih: 1000, savings: 500 });

      const operationId = createResponse.body.data.dailyOps._id;

      const response = await request(app)
        .patch(`/api/v1/operations/daily/${operationId}/submit`)
        .set('Authorization', `Bearer ${brToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dailyOps.isCompleted).toBe(true);
      expect(response.body.data.dailyOps.submittedAt).toBeDefined();
    });

    test('returns 404 for non-existent operation', async () => {
      const response = await request(app)
        .patch('/api/v1/operations/daily/507f1f77bcf86cd799439011/submit')
        .set('Authorization', `Bearer ${brToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/operations/ho-fields', () => {
    test('successfully updates HO fields', async () => {
      // Create operations first as BR
      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ pcih: 1000, savings: 500 });

      const payload = {
        branchId: branch._id,
        date: new Date().toISOString(),
        frmHO: 500,
        frmBR: 300,
        previousLoanTotal: 2000
      };

      const response = await request(app)
        .patch('/api/v1/operations/ho-fields')
        .set('Authorization', `Bearer ${hoToken}`)
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('HO fields updated successfully');
    });

    test('returns 403 for non-HO users', async () => {
      const response = await request(app)
        .patch('/api/v1/operations/ho-fields')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ branchId: branch._id, frmHO: 500 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/operations/history', () => {
    test('returns paginated history', async () => {
      // Create multiple operations
      const dates = ['2025-11-20', '2025-11-21', '2025-11-22'];
      for (const date of dates) {
        await request(app)
          .post('/api/v1/operations/daily')
          .set('Authorization', `Bearer ${brToken}`)
          .send({ date, pcih: 1000 });
      }

      const response = await request(app)
        .get('/api/v1/operations/history')
        .set('Authorization', `Bearer ${brToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.records).toHaveLength(2);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('filters by date range', async () => {
      // Create operations for different dates
      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ date: '2025-11-20', pcih: 1000 });

      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ date: '2025-11-25', pcih: 1000 });

      const response = await request(app)
        .get('/api/v1/operations/history')
        .set('Authorization', `Bearer ${brToken}`)
        .query({ 
          startDate: '2025-11-24',
          endDate: '2025-11-26'
        })
        .expect(200);

      expect(response.body.data.records).toHaveLength(1);
    });
  });

  describe('Authentication and Authorization', () => {
    test('all endpoints require authentication', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/operations/daily' },
        { method: 'post', path: '/api/v1/operations/daily' },
        { method: 'get', path: '/api/v1/operations/all' },
        { method: 'get', path: '/api/v1/operations/history' }
      ];

      for (const endpoint of endpoints) {
        await request(app)[endpoint.method](endpoint.path)
          .expect(401);
      }
    });

    test('BR users can access BR endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/operations/all')
        .set('Authorization', `Bearer ${brToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('HO users can access HO endpoints', async () => {
      // Create some operations first
      await request(app)
        .post('/api/v1/operations/daily')
        .set('Authorization', `Bearer ${brToken}`)
        .send({ pcih: 1000 });

      const response = await request(app)
        .patch('/api/v1/operations/ho-fields')
        .set('Authorization', `Bearer ${hoToken}`)
        .send({ 
          branchId: branch._id,
          frmHO: 500 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles server errors gracefully', async () => {
      // Test with malformed ObjectId
      const response = await request(app)
        .patch('/api/v1/operations/daily/invalid-id/submit')
        .set('Authorization', `Bearer ${brToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});