import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateBody(['name', 'email', 'password']), registerUser);
router.post('/login', validateBody(['email', 'password']), loginUser);

// Protected routes
router.get('/me', protect, getMe);

export default router;
