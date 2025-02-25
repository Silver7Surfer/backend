import express from 'express';
import { authenticateToken, authenticateMonitor} from '../middlewares/auth.js';
import { getWallet, getTransactionHistory, getAllWalletAddresses, processDeposits } from '../controllers/walletController.js';


const router = express.Router();

//user routes
router.get('/wallet-info', authenticateToken, getWallet);
router.get('/wallet-history', authenticateToken, getTransactionHistory);

//admin routes
router.get('/admin/addresses',authenticateMonitor, getAllWalletAddresses);
router.post('/process-deposits',authenticateMonitor, processDeposits);


export default router;