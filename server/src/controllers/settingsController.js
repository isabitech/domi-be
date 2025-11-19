import { asyncHandler } from '../utils/asyncHandler.js';
import Settings from '../models/Settings.js';
import { success } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

class SettingsController {
  getSystem = asyncHandler(async (req, res) => {
    const doc = await Settings.findOne({ key: 'system' });
    success(res, doc?.value || {}, 'System settings fetched');
  });

  updateSystem = asyncHandler(async (req, res) => {
    const payload = req.body || {};
    await Settings.findOneAndUpdate({ key: 'system' }, { value: payload }, { upsert: true, new: true });
    success(res, payload, 'System settings updated');
  });

  getFinancial = asyncHandler(async (req, res) => {
    const doc = await Settings.findOne({ key: 'financial' });
    success(res, doc?.value || {}, 'Financial settings fetched');
  });

  updateFinancial = asyncHandler(async (req, res) => {
    const payload = req.body || {};
    await Settings.findOneAndUpdate({ key: 'financial' }, { value: payload }, { upsert: true, new: true });
    success(res, payload, 'Financial settings updated');
  });

  getSecurity = asyncHandler(async (req, res) => {
    const doc = await Settings.findOne({ key: 'security' });
    success(res, doc?.value || {}, 'Security settings fetched');
  });

  updateSecurity = asyncHandler(async (req, res) => {
    const payload = req.body || {};
    await Settings.findOneAndUpdate({ key: 'security' }, { value: payload }, { upsert: true, new: true });
    success(res, payload, 'Security settings updated');
  });

  getNotifications = asyncHandler(async (req, res) => {
    const doc = await Settings.findOne({ key: 'notifications' });
    success(res, doc?.value || {}, 'Notification settings fetched');
  });

  updateNotifications = asyncHandler(async (req, res) => {
    const payload = req.body || {};
    await Settings.findOneAndUpdate({ key: 'notifications' }, { value: payload }, { upsert: true, new: true });
    success(res, payload, 'Notification settings updated');
  });
}

export default new SettingsController();
