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
// Get all for branch (with optional date filtering)
router.get(
	'/senate-planning/branch/all',
	protect,
	tryCatch(senatePlaningController.getAllForBranch)
);
// Get all
router.get(
	'/senate-planning',
	protect,
	tryCatch(senatePlaningController.getAllSenatePlanning)
);

// Get by ID
router.get(
	'/senate-planning/:id',
	protect,
	tryCatch(senatePlaningController.getSenatePlanningById)
);

export default router;