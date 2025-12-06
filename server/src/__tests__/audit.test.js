import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import { logAudit, logAuditBatch, fetchAuditLogs, AUDIT_ACTIONS } from '../utils/audit.js';

describe('Audit Utility', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/domi_audit_test');
    }
  });
  beforeEach(async () => {
    await AuditLog.deleteMany({});
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('masks sensitive fields and records diff', async () => {
    const user = { id: new mongoose.Types.ObjectId(), username: 'tester' };
    const oldDoc = { password: 'secret', amount: 10 };
    const newDoc = { password: 'another', amount: 15 };
    await logAudit({ user, action: AUDIT_ACTIONS.UPDATE, resource: 'cashbook', resourceId: 'abc', oldDoc, newDoc });
    const entry = await AuditLog.findOne({ resource: 'cashbook' });
    expect(entry).toBeTruthy();
    expect(entry.oldValue.password).toBe('[REDACTED]');
    expect(entry.newValue.password).toBe('[REDACTED]');
    expect(entry.diff.amount.before).toBe(10);
    expect(entry.diff.amount.after).toBe(15);
  });

  test('batch logging and pagination', async () => {
    const user = { id: new mongoose.Types.ObjectId(), username: 'tester' };
    const batch = Array.from({ length: 30 }).map((_, i) => ({
      user,
      action: AUDIT_ACTIONS.CREATE,
      resource: 'user',
      resourceId: `u${i}`,
      oldDoc: null,
      newDoc: { username: `user${i}` },
      enableDiff: false
    }));
    await logAuditBatch(batch);
    const page2 = await fetchAuditLogs({ resource: 'user', page: 2, limit: 10 });
    expect(page2.items.length).toBe(10);
    expect(page2.total).toBe(30);
    expect(page2.page).toBe(2);
  });
});
