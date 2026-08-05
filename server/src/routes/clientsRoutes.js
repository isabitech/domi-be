import express from 'express';
import clientsController from '../controllers/clientsController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { clientsSchemas } from '../validators/clientsSchemas.js';

const router = express.Router();

router.use(protect);

router.get('/', validate(clientsSchemas.list), tryCatch(clientsController.list));
router.get('/summary', validate(clientsSchemas.summary), tryCatch(clientsController.summary));
router.get('/:id', validate(clientsSchemas.getById), tryCatch(clientsController.getById));
router.post('/', validate(clientsSchemas.create), tryCatch(clientsController.create));
router.put('/:id', validate(clientsSchemas.update), tryCatch(clientsController.update));
router.delete('/:id', validate(clientsSchemas.delete), tryCatch(clientsController.delete));

export default router;
