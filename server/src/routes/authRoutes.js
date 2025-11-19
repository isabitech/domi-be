import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authSchemas } from '../validators/authSchemas.js';

const router = express.Router();

router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', validate(authSchemas.login), authController.login);
router.post('/logout', protect, authController.logout);
router.post('/forgot-password', validate(authSchemas.forgot), authController.forgotPassword);
router.put('/reset-password/:resettoken', validate(authSchemas.reset), authController.resetPassword);
router.get('/me', protect, authController.getMe);

export default router;