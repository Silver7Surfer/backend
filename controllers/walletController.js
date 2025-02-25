import Wallet from '../models/Wallet.js'; 

export const getWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user.userId });
        
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        res.json({
            wallet: {
                totalBalanceUSD: wallet.totalBalanceUSD,
                btc: {
                    address: wallet.btc.address,
                    //balance: wallet.btc.balance
                },
                usdt: {
                    trc20: {
                        address: wallet.usdt.trc20.address,
                        //balance: wallet.usdt.trc20.balance
                    },
                    bep20: {
                        address: wallet.usdt.bep20.address,
                        //balance: wallet.usdt.bep20.balance
                    }
                }
            }
        });
    } catch (error) {
        console.error('Wallet fetch error:', error);
        res.status(500).json({ message: 'Error fetching wallet', error: error.message });
    }
};

export const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            type,
            asset,
            network,
            startDate,
            endDate,
            gameName,
        } = req.query;

        // Find user's wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // Build filter object
        let filter = {};
        if (type) filter['transactions.type'] = type;
        if (asset) filter['transactions.asset'] = asset;
        if (network) filter['transactions.network'] = network;
        if (gameName) filter['transactions.gameName'] = gameName;

        // Date filter
        if (startDate || endDate) {
            filter['transactions.timestamp'] = {};
            if (startDate) filter['transactions.timestamp'].$gte = new Date(startDate);
            if (endDate) filter['transactions.timestamp'].$lte = new Date(endDate);
        }

        // Get filtered transactions
        let transactions = wallet.transactions;

        // Apply filters
        if (Object.keys(filter).length > 0) {
            transactions = transactions.filter(tx => {
                let match = true;
                if (type) match = match && tx.type === type;
                if (asset) match = match && tx.asset === asset;
                if (network) match = match && tx.network === network;
                if (gameName) match = match && tx.gameName === gameName;
                if (startDate) match = match && tx.timestamp >= new Date(startDate);
                if (endDate) match = match && tx.timestamp <= new Date(endDate);
                return match;
            });
        }

        // Sort by timestamp descending
        transactions.sort((a, b) => b.timestamp - a.timestamp);

        // Pagination
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const paginatedTransactions = transactions.slice(skip, skip + limit);

        // Calculate statistics
        const stats = {
            totalTransactions: transactions.length,
            totalDeposits: transactions.reduce((sum, tx) => 
                tx.type === 'deposit' ? sum + tx.amount : sum, 0),
            totalGameCredits: transactions.reduce((sum, tx) => 
                tx.type === 'game_credit' ? sum + tx.amount : sum, 0),
            totalWithdrawals: transactions.reduce((sum, tx) => 
                tx.type === 'withdrawal' ? sum + tx.amount : sum, 0)
        };

        res.json({
            success: true,
            data: {
                transactions: paginatedTransactions,
                pagination: {
                    total: transactions.length,
                    page,
                    limit,
                    totalPages: Math.ceil(transactions.length / limit)
                },
                stats
            }
        });
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transaction history',
            error: error.message
        });
    }
};


export const getAllWalletAddresses = async (req, res) => {
    try {
        // Bypass admin check for now
        // TODO: Implement proper admin authentication later
        
        // Get all wallets with just the address fields
        const wallets = await Wallet.find({}, {
            'btc.address': 1,
            'usdt.trc20.address': 1,
            'usdt.bep20.address': 1,
            'userId': 1
        });

        // Format the response
        const formattedWallets = {
            btcAddresses: wallets.map(w => w.btc.address),
            trc20Addresses: wallets.map(w => w.usdt.trc20.address),
            bep20Addresses: wallets.map(w => w.usdt.bep20.address)
        };

        // Optional: Include detailed view with user IDs
        const detailedWallets = wallets.map(w => ({
            userId: w.userId,
            addresses: {
                btc: w.btc.address,
                trc20: w.usdt.trc20.address,
                bep20: w.usdt.bep20.address
            }
        }));

        res.json({
            success: true,
            data: {
                // Grouped by network
                grouped: formattedWallets,
                // Detailed view with userIds
                detailed: detailedWallets,
                // Stats
                stats: {
                    totalWallets: wallets.length,
                    uniqueAddresses: {
                        btc: new Set(formattedWallets.btcAddresses).size,
                        trc20: new Set(formattedWallets.trc20Addresses).size,
                        bep20: new Set(formattedWallets.bep20Addresses).size
                    }
                }
            }
        });

    } catch (error) {
        console.error('Admin wallet fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet addresses',
            error: error.message
        });
    }
};

// Add this to your wallet controller file

export const processDeposits = async (req, res) => {
    try {
        const { deposits, source } = req.body;
        
        if (!deposits || !Array.isArray(deposits) || deposits.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid deposits provided'
            });
        }
        
        console.log(`Processing ${deposits.length} deposits from ${source || 'unknown source'}`);
        
        let processed = 0;
        
        // Process each deposit
        for (const deposit of deposits) {
            const { userId, txHash, amount, asset, network } = deposit;
            
            // Find user's wallet
            const wallet = await Wallet.findOne({ userId });
            
            if (!wallet) {
                console.error(`Wallet not found for user ${userId}`);
                continue;
            }
            
            // Check if this transaction is already processed
            const existingTx = wallet.transactions.find(tx => 
                tx.txHash === txHash && tx.type === 'deposit'
            );
            
            if (existingTx) {
                console.log(`Transaction ${txHash} already processed for user ${userId}`);
                continue;
            }
            
            // Process the deposit
            await wallet.processDeposit(asset, network, amount, txHash);
            processed++;
            
            console.log(`Processed deposit of ${amount} ${asset} via ${network} for user ${userId}`);
        }
        
        res.json({
            success: true,
            message: `Successfully processed ${processed} out of ${deposits.length} deposits`,
            processed
        });
        
    } catch (error) {
        console.error('Error processing deposits:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing deposits',
            error: error.message
        });
    }
};