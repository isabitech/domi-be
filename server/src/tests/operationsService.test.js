import { connect, closeDatabase, clearDatabase } from './setupTestDB.js';
import OperationsService from '../services/OperationsService.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import DailyOperations from '../models/DailyOperations.js';
import Cashbook1 from '../models/Cashbook1.js';
import Cashbook2 from '../models/Cashbook2.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });
afterEach(async () => { await clearDatabase(); });

function mockReq(userOverrides = {}, bodyOverrides = {}, queryOverrides = {}) {
  return {
    user: { id: userOverrides.id, role: userOverrides.role, branch: userOverrides.branch },
    body: bodyOverrides,
    query: queryOverrides,
    params: userOverrides.params || {}
  };
}

describe('OperationsService', () => {
  describe('createOrUpdate', () => {
    test('creates new daily operations with all components', async () => {
      const branch = await Branch.create({ 
        name: 'Test Branch', 
        code: 'TB001', 
        previousLoanTotal: 5000, 
        previousSavingsTotal: 3000, 
        previousDisbursement: 2000 
      });
      const user = await User.create({ 
        name: 'Branch User', 
        email: 'br@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

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

      const req = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        payload
      );

      const result = await OperationsService.createOrUpdate(req);

      expect(result).toBeDefined();
      expect(result.branch.name).toBe('Test Branch');
      expect(result.user.name).toBe('Branch User');
      expect(result.cashbook1).toBeDefined();
      expect(result.cashbook2).toBeDefined();
      expect(result.prediction).toBeDefined();
      expect(result.bankStatement1).toBeDefined();
      expect(result.bankStatement2).toBeDefined();
      expect(result.loanRegister).toBeDefined();
      expect(result.savingsRegister).toBeDefined();

      // Check cashbook1 values
      expect(result.cashbook1.pcih).toBe(1500.50);
      expect(result.cashbook1.savings).toBe(2500.75);
      expect(result.cashbook1.loanCollection).toBe(3000.00);
      expect(result.cashbook1.chargesCollection).toBe(250.25);

      // Check cashbook2 values
      expect(result.cashbook2.disNo).toBe(5);
      expect(result.cashbook2.disAmt).toBe(10000.00);
      expect(result.cashbook2.disWithInt).toBe(12000.00);
      expect(result.cashbook2.savWith).toBe(800.50);
      expect(result.cashbook2.domiBank).toBe(500.00);
      expect(result.cashbook2.posT).toBe(300.75);

      // Check prediction values
      expect(result.prediction.predictionNo).toBe(3);
      expect(result.prediction.predictionAmount).toBe(8000.00);

      // Check bank statement 2 values
      expect(result.bankStatement2.exAmt).toBe(200.00);
      expect(result.bankStatement2.exPurpose).toBe('Office supplies');
    });

    test('updates existing daily operations for same date', async () => {
      const branch = await Branch.create({ 
        name: 'Update Branch', 
        code: 'UB001', 
        previousLoanTotal: 1000, 
        previousSavingsTotal: 500 
      });
      const user = await User.create({ 
        name: 'Update User', 
        email: 'update@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      const date = new Date('2025-11-26T00:00:00.000Z');
      
      // First create
      const req1 = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        { date, pcih: 1000, savings: 500 }
      );
      const first = await OperationsService.createOrUpdate(req1);
      
      // Then update with same date
      const req2 = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        { date, pcih: 1500, savings: 800, loanCollection: 2000 }
      );
      const updated = await OperationsService.createOrUpdate(req2);

      expect(updated._id.toString()).toBe(first._id.toString());
      expect(updated.cashbook1.pcih).toBe(1500);
      expect(updated.cashbook1.savings).toBe(800);
      expect(updated.cashbook1.loanCollection).toBe(2000);
    });

    test('throws ForbiddenError for non-BR users', async () => {
      const branch = await Branch.create({ name: 'Test Branch', code: 'TB001' });
      const user = await User.create({ 
        name: 'HO User', 
        email: 'ho@test.com', 
        password: 'Passw0rd!', 
        role: 'HO', 
        branch: branch._id 
      });

      const req = mockReq(
        { id: user._id.toString(), role: 'HO', branch: branch._id },
        { pcih: 1000 }
      );

      await expect(OperationsService.createOrUpdate(req)).rejects.toThrow(ForbiddenError);
    });

    test('handles minimal payload with defaults', async () => {
      const branch = await Branch.create({ 
        name: 'Min Branch', 
        code: 'MB001', 
        previousLoanTotal: 0, 
        previousSavingsTotal: 0 
      });
      const user = await User.create({ 
        name: 'Min User', 
        email: 'min@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      const req = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        { pcih: 500 }
      );

      const result = await OperationsService.createOrUpdate(req);

      expect(result.cashbook1.pcih).toBe(500);
      expect(result.cashbook1.savings).toBe(0);
      expect(result.cashbook2.disAmt).toBe(0);
      expect(result.prediction.predictionNo).toBe(0);
    });
  });

  describe('getDaily', () => {
    test('fetches daily operations for BR user', async () => {
      const branch = await Branch.create({ name: 'Get Branch', code: 'GB001' });
      const user = await User.create({ 
        name: 'Get User', 
        email: 'get@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      // Create operations first
      const createReq = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        { pcih: 1000, savings: 500 }
      );
      await OperationsService.createOrUpdate(createReq);

      // Then fetch
      const getReq = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        {},
        { date: '2025-11-26' }
      );
      const result = await OperationsService.getDaily(getReq);

      expect(result).toBeDefined();
      expect(result.branch.name).toBe('Get Branch');
      expect(result.cashbook1.pcih).toBe(1000);
    });

    test('returns null for non-existent date', async () => {
      const branch = await Branch.create({ name: 'Empty Branch', code: 'EB001' });
      const user = await User.create({ 
        name: 'Empty User', 
        email: 'empty@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      const req = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        {},
        { date: '2025-12-01' }
      );
      const result = await OperationsService.getDaily(req);

      expect(result).toBeNull();
    });
  });

  describe('getAllDaily', () => {
    test('fetches all operations for BR user', async () => {
      const branch = await Branch.create({ name: 'All Branch', code: 'AB001' });
      const user = await User.create({ 
        name: 'All User', 
        email: 'all@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      // Create multiple operations
      const dates = ['2025-11-24', '2025-11-25', '2025-11-26'];
      for (const date of dates) {
        const req = mockReq(
          { id: user._id.toString(), role: 'BR', branch: branch._id },
          { date, pcih: 1000, savings: 500 }
        );
        await OperationsService.createOrUpdate(req);
      }

      const getAllReq = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id }
      );
      const result = await OperationsService.getAllDaily(getAllReq);

      expect(result.operations).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.operations[0].date).toBeDefined();
    });
  });

  describe('submit', () => {
    test('successfully submits daily operations', async () => {
      const branch = await Branch.create({ name: 'Submit Branch', code: 'SB001' });
      const user = await User.create({ 
        name: 'Submit User', 
        email: 'submit@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      // Create operations first
      const createReq = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        { pcih: 1000, savings: 500 }
      );
      const dailyOps = await OperationsService.createOrUpdate(createReq);

      // Then submit
      const submitReq = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id, params: { id: dailyOps._id } },
        {}
      );
      submitReq.params = { id: dailyOps._id };
      const result = await OperationsService.submit(submitReq);

      expect(result.isCompleted).toBe(true);
      expect(result.submittedAt).toBeInstanceOf(Date);
    });

    test('throws NotFoundError for non-existent operation', async () => {
      const branch = await Branch.create({ name: 'Error Branch', code: 'ER001' });
      const user = await User.create({ 
        name: 'Error User', 
        email: 'error@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      const req = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        {}
      );
      req.params = { id: '507f1f77bcf86cd799439011' };

      await expect(OperationsService.submit(req)).rejects.toThrow(NotFoundError);
    });

    test('throws ForbiddenError for unauthorized user', async () => {
      const branch = await Branch.create({ name: 'Auth Branch', code: 'AU001' });
      const user1 = await User.create({ 
        name: 'Auth User 1', 
        email: 'auth1@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });
      const user2 = await User.create({ 
        name: 'Auth User 2', 
        email: 'auth2@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      // Create with user1
      const createReq = mockReq(
        { id: user1._id.toString(), role: 'BR', branch: branch._id },
        { pcih: 1000 }
      );
      const dailyOps = await OperationsService.createOrUpdate(createReq);

      // Try to submit with user2
      const submitReq = mockReq(
        { id: user2._id.toString(), role: 'BR', branch: branch._id },
        {}
      );
      submitReq.params = { id: dailyOps._id };

      await expect(OperationsService.submit(submitReq)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateHOFields', () => {
    test('successfully updates HO fields', async () => {
      const branch = await Branch.create({ 
        name: 'HO Branch', 
        code: 'HO001',
        previousLoanTotal: 1000,
        previousSavingsTotal: 500
      });
      const brUser = await User.create({ 
        name: 'BR User', 
        email: 'br@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });
      const hoUser = await User.create({ 
        name: 'HO User', 
        email: 'ho@test.com', 
        password: 'Passw0rd!', 
        role: 'HO', 
        branch: branch._id 
      });

      // Create operations first
      const createReq = mockReq(
        { id: brUser._id.toString(), role: 'BR', branch: branch._id },
        { pcih: 1000, savings: 500 }
      );
      await OperationsService.createOrUpdate(createReq);

      // Update HO fields
      const updateReq = mockReq(
        { id: hoUser._id.toString(), role: 'HO', branch: branch._id },
        {
          branchId: branch._id,
          date: new Date(),
          frmHO: 500,
          frmBR: 300,
          previousLoanTotal: 2000
        }
      );
      const result = await OperationsService.updateHOFields(updateReq);

      expect(result.message).toBe('HO fields updated successfully');
    });

    test('throws ForbiddenError for non-HO users', async () => {
      const branch = await Branch.create({ name: 'Forbidden Branch', code: 'FB001' });
      const user = await User.create({ 
        name: 'BR User', 
        email: 'br@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      const req = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        { branchId: branch._id, frmHO: 500 }
      );

      await expect(OperationsService.updateHOFields(req)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listHistory', () => {
    test('returns paginated history', async () => {
      const branch = await Branch.create({ name: 'History Branch', code: 'HB001' });
      const user = await User.create({ 
        name: 'History User', 
        email: 'history@test.com', 
        password: 'Passw0rd!', 
        role: 'BR', 
        branch: branch._id 
      });

      // Create multiple operations
      const dates = ['2025-11-20', '2025-11-21', '2025-11-22'];
      for (const date of dates) {
        const req = mockReq(
          { id: user._id.toString(), role: 'BR', branch: branch._id },
          { date, pcih: 1000 }
        );
        await OperationsService.createOrUpdate(req);
      }

      const historyReq = mockReq(
        { id: user._id.toString(), role: 'BR', branch: branch._id },
        {},
        { page: 1, limit: 2 }
      );
      const result = await OperationsService.listHistory(historyReq);

      expect(result.records).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.pagination).toBeDefined();
    });
  });
});
