import express from 'express';
import { authenticateToken, authenticateMonitor, authorizeRole} from '../middlewares/auth.js';
import { getWallet, getTransactionHistory, getAllWalletAddresses, processDeposits } from '../controllers/walletController.js';


const router = express.Router();

//user routes
router.get('/wallet-info', authenticateToken,authorizeRole(['user', 'admin']), getWallet);
router.get('/wallet-history', authenticateToken,authorizeRole(['user', 'admin']), getTransactionHistory);

//admin routes
router.get('/admin/addresses',authenticateMonitor, getAllWalletAddresses);
router.post('/process-deposits',authenticateMonitor, processDeposits);


export default router;