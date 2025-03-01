// routes/gameProfileRoutes.js
import express from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';
import {
    requestGameProfile,
    assignGameId,
    requestCreditAmount,
    approveCreditAmount,
    getAllGameProfiles,
    approveRedeem,
    requestRedeem,
    initiateWithdraw,
    disapproveCredit,
    disapproveRedeem
} from '../controllers/gameProfileController.js';

const router = express.Router();

// User routes
router.post('/request', authenticateToken,authorizeRole(['user', 'admin']), requestGameProfile);
router.post('/request-credit', authenticateToken,authorizeRole(['user', 'admin']), requestCreditAmount);
router.post('/request-redeem', authenticateToken,authorizeRole(['user', 'admin']), requestRedeem);
router.post('/initiate-withdraw', authenticateToken,authorizeRole(['user', 'admin']), initiateWithdraw);
router.get('/gameprofile', authenticateToken,authorizeRole(['user', 'admin']), getAllGameProfiles);

// Admin routes
router.post('/assign-gameid', authenticateToken,authorizeRole(['admin']),  assignGameId);
router.post('/approve-credit', authenticateToken, authorizeRole(['admin']),approveCreditAmount);
router.post('/approve-redeem', authenticateToken,authorizeRole(['admin']),  approveRedeem);
router.post('/disapprove-credit', authenticateToken, authorizeRole(['admin']),disapproveCredit);
router.post('/disapprove-redeem', authenticateToken,authorizeRole(['admin']),  disapproveRedeem);

export default router;