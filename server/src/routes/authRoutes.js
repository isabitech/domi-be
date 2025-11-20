import express from 'express';
import authController from '../controllers/authController.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authSchemas } from '../validators/authSchemas.js';

const router = express.Router();

router.post('/register', validate(authSchemas.register), tryCatch(authController.register));
router.post('/login', validate(authSchemas.login), tryCatch(authController.login));
router.post('/logout', protect, tryCatch(authController.logout));
router.post('/forgot-password', validate(authSchemas.forgot), tryCatch(authController.forgotPassword));
router.put('/reset-password/:resettoken', validate(authSchemas.reset), tryCatch(authController.resetPassword));
router.get('/me', protect, tryCatch(authController.getMe));

export default router;