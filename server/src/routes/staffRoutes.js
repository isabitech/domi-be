import express from 'express';
import staffController from '../controllers/staffController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { staffSchemas } from '../validators/staffSchemas.js';

const router = express.Router();

router.use(protect);
router.use(authorizeHO);

router.get('/', validate(staffSchemas.list), tryCatch(staffController.list));
router.post('/', validate(staffSchemas.create), tryCatch(staffController.create));
router.put('/:id', validate(staffSchemas.update), tryCatch(staffController.update));
router.delete('/:id', validate(staffSchemas.delete), tryCatch(staffController.delete));

export default router;
