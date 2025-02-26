import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import gameProfileRoutes from './routes/gameProfileRoutes.js';
import connectDB from './config/db.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;



app.use(express.json());
app.use(cors({
    origin: '*', // Temporarily allow all origins for debugging
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.urlencoded({ extended: true }));



app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/game-profile', gameProfileRoutes);






/////////////////////////////////////////////////


app.post('/deposit', async (req, res) => {
  try {
      const { userId, asset, network, amount } = req.body;

      // Find the user's wallet
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
          return res.status(404).json({ message: 'Wallet not found' });
      }

      // Process deposit using the Wallet model method
      await wallet.processDeposit(asset, network, amount);
      res.json({ message: 'Deposit successful', wallet });

  } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/reset-balance', async (req, res) => {
  try {
      const { userId } = req.body;

      // Find the user's wallet
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
          return res.status(404).json({ message: 'Wallet not found' });
      }

      // Reset total balance
      await wallet.resetTotalBalanceUSD();
      res.json({ message: 'Balance reset successful', wallet });

  } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
  }
});



app.listen(PORT, async () => {
  console.log(`server is running on http://localhost:${PORT}`);
  await connectDB();
})