import express from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, resendVerification } from '../controllers/authController.js';
import {authenticateToken} from '../middlewares/auth.js';
import { validateRegistration, validateLogin } from '../middlewares/validation.js';

const router = express.Router();


router.post('/register',validateRegistration, register);
router.post('/login',validateLogin, login);
router.get('/verify-email/:token', verifyEmail);
router.get('/resend-verification', authenticateToken, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);


export default router;