
import express from 'express';
import senatePlaningController from '../controllers/senatePlaningController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { senatePlaningSchemas } from '../validators/senatePlaningValidator.js';
import { tryCatch } from '../utils/asyncHandler.js';

const router = express.Router();

router.post(
	'/senate-planning',
	protect,
	validate(senatePlaningSchemas.create),
	tryCatch(senatePlaningController.createSenatePlanning)
);

export default router;