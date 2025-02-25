// routes/gameProfileRoutes.js
import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
    requestGameProfile,
    assignGameId,
    requestCreditAmount,
    approveCreditAmount,
    getAllGameProfiles,
    approveRedeem,
    requestRedeem,
    initiateWithdraw
} from '../controllers/gameProfileController.js';

const router = express.Router();

// User routes
router.post('/request', authenticateToken, requestGameProfile);
router.post('/request-credit', authenticateToken, requestCreditAmount);
router.post('/request-redeem', authenticateToken, requestRedeem);
router.post('/initiate-withdraw', authenticateToken, initiateWithdraw);
router.get('/gameprofile', authenticateToken, getAllGameProfiles);

// Admin routes
router.post('/assign-gameid', authenticateToken,  assignGameId);
router.post('/approve-credit', authenticateToken, approveCreditAmount);
router.post('/approve-redeem', authenticateToken,  approveRedeem);

export default router;