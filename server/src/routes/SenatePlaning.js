import express from 'express';
import senatePlaningController from '../controllers/senatePlaningController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { senatePlaningSchemas } from '../validators/senatePlaningValidator.js';
import { tryCatch } from '../utils/asyncHandler.js';

const router = express.Router();


// Create
router.post(
	'/',
	protect,
	validate(senatePlaningSchemas.create),
	tryCatch(senatePlaningController.createSenatePlanning)
);
// Get all for branch for a specific date (date as path param)
router.get(
	'/branch/:date',
	protect,
	tryCatch(senatePlaningController.getAllForBranch)
);
// Get all
router.get(
	'/',
	protect,
	tryCatch(senatePlaningController.getAllSenatePlanning)
);
// Update by ID
router.put(
	'/:id',
	protect,
	validate(senatePlaningSchemas.create),
	tryCatch(senatePlaningController.updateSenatePlanning)
);
// Get by ID
router.get(
	'/:id',
	protect,
	tryCatch(senatePlaningController.getSenatePlanningById)
);

export default router;