import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import ClientsService from '../services/ClientsService.js';

class ClientsController {
  list = asyncHandler(async (req, res) => {
    const data = await ClientsService.list(req);
    success(res, data, 'Clients fetched successfully');
  });

  create = asyncHandler(async (req, res) => {
    const data = await ClientsService.create(req);
    success(res, data, 'Client created successfully', 201);
  });

  update = asyncHandler(async (req, res) => {
    const data = await ClientsService.update(req);
    success(res, data, 'Client updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await ClientsService.delete(req);
    success(res, {}, 'Client deleted successfully');
  });

  summary = asyncHandler(async (req, res) => {
    const data = await ClientsService.summary(req);
    success(res, data, 'Client summary fetched successfully');
  });
}

export default new ClientsController();
