import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import StaffService from '../services/StaffService.js';

class StaffController {
  list = asyncHandler(async (req, res) => {
    const data = await StaffService.list(req);
    success(res, data, 'Staff records fetched successfully');
  });

  create = asyncHandler(async (req, res) => {
    const data = await StaffService.create(req);
    success(res, data, 'Staff record created successfully', 201);
  });

  update = asyncHandler(async (req, res) => {
    const data = await StaffService.update(req);
    success(res, data, 'Staff record updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await StaffService.delete(req);
    success(res, {}, 'Staff record deleted successfully');
  });
}

export default new StaffController();
