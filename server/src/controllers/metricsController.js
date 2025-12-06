import MetricsService from '../services/MetricsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';

// GET /metrics/online-cih-tso?date=YYYY-MM-DD
export const getOnlineCIHTSODaily = asyncHandler(async (req, res) => {
  const data = await MetricsService.dailyOnlineCIHTSO(req);
  success(res, data, 'Online CIH & TSO metrics');
});

export default { getOnlineCIHTSODaily };