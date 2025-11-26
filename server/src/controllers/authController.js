import authService from '../services/AuthServices.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, req);
    success(res, result, 'User created', 201);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req);
    success(res, result, 'Login ok');
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    success(res, user, 'Profile loaded');
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email, req.user, req);
    success(res, result, 'Reset email sent');
  });

  resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(
      req.params.resettoken,
      req.body.password,
      req.user,
      req
    );
    success(res, result, 'Password reset ok');
  });

  logout = asyncHandler(async (req, res) => {
    const rawToken = req.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    await authService.revokeToken(rawToken, req.user, req);
    success(res, {}, 'Logged out');
  });
}

export default new AuthController();
