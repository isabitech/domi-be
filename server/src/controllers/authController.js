import authService from '../services/AuthServices.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    success(res, result, 'User registered', 201);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    success(res, result, 'Login successful');
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    success(res, user, 'Profile fetched');
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    success(res, result, 'Password reset email sent');
  });

  resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(
      req.params.resettoken,
      req.body.password
    );
    success(res, result, 'Password reset successful');
  });

  logout = asyncHandler(async (req, res) => {
    const rawToken = req.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    await authService.revokeToken(rawToken);
    success(res, {}, 'Logged out successfully');
  });
}

export default new AuthController();
