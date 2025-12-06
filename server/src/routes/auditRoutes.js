import express from 'express';
import auditController from '../controllers/auditController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { auditSchemas } from '../validators/auditSchemas.js';
import { tryCatch } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);
router.use(authorizeHO);

router.get('/', validate(auditSchemas.list), tryCatch(auditController.list));

export default router;
