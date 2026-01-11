import express from 'express';
import senatePlaningController from '../controllers/senatePlaningController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { senatePlaningSchemas } from '../validators/senatePlaningValidator.js';
import { tryCatch } from '../utils/asyncHandler.js';

const router = express.Router();


// Create
router.post(
	'/senate-planning',
	protect,
	validate(senatePlaningSchemas.create),
	tryCatch(senatePlaningController.createSenatePlanning)
);
// Get all for branch for a specific date (date as path param)
router.get(
	'/senate-planning/branch/:date',
	protect,
	tryCatch(senatePlaningController.getAllForBranch)
);
// Get all
router.get(
	'/senate-planning',
	protect,
	tryCatch(senatePlaningController.getAllSenatePlanning)
);
// Update by ID
router.put(
	'/senate-planning/:id',
	protect,
	validate(senatePlaningSchemas.create),
	tryCatch(senatePlaningController.updateSenatePlanning)
);
// Get by ID
router.get(
	'/senate-planning/:id',
	protect,
	tryCatch(senatePlaningController.getSenatePlanningById)
);

export default router;