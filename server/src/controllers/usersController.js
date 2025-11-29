import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import UsersService from '../services/UsersService.js';

class UsersController {
  list = asyncHandler(async (req, res) => {
    const { users, pagination } = await UsersService.listUsers(req.query, req.user);
    success(res, { users, pagination }, 'Users fetched');
  });

  create = asyncHandler(async (req, res) => {
    const user = await UsersService.createUser(req.body, req.user, req);
    success(res, { user }, 'User created', 201);
  });

  update = asyncHandler(async (req, res) => {
    const user = await UsersService.updateUser(req.params.id, req.body, req.user, req);
    success(res, { user }, 'User updated');
  });

  delete = asyncHandler(async (req, res) => {
    await UsersService.deleteUser(req.params.id, req.user, req);
    success(res, {}, 'User deleted');
  });
}

export default new UsersController();
