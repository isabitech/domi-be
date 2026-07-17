import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import InvestorsService from '../services/InvestorsService.js';

class InvestorsController {
  list = asyncHandler(async (req, res) => {
    const data = await InvestorsService.list(req);
    success(res, data, 'Investor records fetched successfully');
  });

  create = asyncHandler(async (req, res) => {
    const data = await InvestorsService.create(req);
    success(res, data, 'Investor record created successfully', 201);
  });

  update = asyncHandler(async (req, res) => {
    const data = await InvestorsService.update(req);
    success(res, data, 'Investor record updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await InvestorsService.delete(req);
    success(res, {}, 'Investor record deleted successfully');
  });
}

export default new InvestorsController();