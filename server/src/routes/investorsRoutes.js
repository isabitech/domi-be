import express from 'express';
import investorsController from '../controllers/investorsController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { investorsSchemas } from '../validators/investorsSchemas.js';

const router = express.Router();

router.use(protect);
router.use(authorizeHO);

router.get('/', validate(investorsSchemas.list), tryCatch(investorsController.list));
router.post('/', validate(investorsSchemas.create), tryCatch(investorsController.create));
router.put('/:id', validate(investorsSchemas.update), tryCatch(investorsController.update));
router.delete('/:id', validate(investorsSchemas.delete), tryCatch(investorsController.delete));

export default router;