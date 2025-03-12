import express from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, resendVerification, isLoggedin } from '../controllers/authController.js';
import {authenticateToken} from '../middlewares/auth.js';
import { validateRegistration, validateLogin } from '../middlewares/validation.js';

const router = express.Router();


router.post('/register',validateRegistration, register);
router.post('/login',validateLogin, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification',  resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get("/me", authenticateToken, isLoggedin);


export default router;