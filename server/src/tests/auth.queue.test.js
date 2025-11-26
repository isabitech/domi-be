import { jest } from '@jest/globals';

const enqueueEmailMock = jest.fn();

jest.unstable_mockModule('../utils/emailQueue.js', () => ({
  enqueueEmail: enqueueEmailMock
}));

const { default: AuthService } = await import('../services/AuthServices.js');
const { connect, closeDatabase, clearDatabase } = await import('./setupTestDB.js');
const { default: Branch } = await import('../models/Branch.js');
const { default: User } = await import('../models/User.js');

describe('AuthService login notifications', () => {
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
    enqueueEmailMock.mockReset();
  });

  test('branch login queues an email for each HO user', async () => {
    const branch = await Branch.create({ name: 'Queue Branch', code: 'QB01' });

    await User.create({
      name: 'HO User',
      email: 'ho@example.com',
      password: 'Passw0rd!',
      role: 'HO',
      isActive: true
    });

    const branchUser = await User.create({
      name: 'Branch User',
      email: 'branch@example.com',
      password: 'Passw0rd!',
      role: 'BR',
      branch: branch._id
    });

    const result = await AuthService.login({ email: branchUser.email, password: 'Passw0rd!' });

    expect(result.token).toBeDefined();
    expect(enqueueEmailMock).toHaveBeenCalledTimes(1);
    expect(enqueueEmailMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      email: 'ho@example.com',
      subject: 'Branch Login Notification'
    }));
  });
});
