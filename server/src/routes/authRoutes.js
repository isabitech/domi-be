import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authSchemas } from '../validators/authSchemas.js';
import { tryCatch } from '../utils/asyncHandler.js';
const router = express.Router();

// Public endpoints
router.post('/login', validate(authSchemas.login), tryCatch(authController.login));
router.post('/forgot-password', validate(authSchemas.forgot), tryCatch(authController.forgotPassword));
router.put('/reset-password/:resettoken', validate(authSchemas.reset), tryCatch(authController.resetPassword));

// All other endpoints require authentication
router.use(protect);
// router.post('/register', validate(authSchemas.register), tryCatch(authController.register));
router.post('/logout', tryCatch(authController.logout));
router.get('/me', tryCatch(authController.getMe));

export default router;