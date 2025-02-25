// routes/userRoutes.js
import express from 'express';
import { getUserData } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Protected route - requires authentication
router.get('/me', authenticateToken, getUserData);

export default router;