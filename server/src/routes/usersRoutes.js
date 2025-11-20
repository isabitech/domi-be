import express from 'express';
import usersController from '../controllers/usersController.js';
import { protect, authorizeHO } from '../middleware/auth.js';
// permissions handled via authorizeHO for users management
import { validate } from '../middleware/validation.js';
import { tryCatch } from '../utils/asyncHandler.js';
import { userSchemas } from '../validators/userSchemas.js';

const router = express.Router();

// Only HO users
router.use(protect);
router.use(authorizeHO);

router.get('/', validate(userSchemas.list), tryCatch(usersController.list));
router.post('/', validate(userSchemas.create), tryCatch(usersController.create));
router.put('/:id', validate(userSchemas.update), tryCatch(usersController.update));
router.delete('/:id', validate(userSchemas.delete), tryCatch(usersController.delete));

export default router;
