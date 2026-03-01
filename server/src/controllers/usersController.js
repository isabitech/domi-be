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

  resetPassword = asyncHandler(async (req, res) => {
    const { password, confirm_password } = req.body;

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (password !== confirm_password) {
      throw new Error('Passwords do not match');
    }

    const user = await UsersService.resetPassword(
      req.params.id,
      password,
      req.user,
      req
    );

    success(res, { user }, 'User password reset');
  });
  getById = asyncHandler(async (req, res) => {
    const user = await UsersService.getUserById(req.params.id);
    success(res, { user }, 'User fetched');
  });

}

export default new UsersController();
