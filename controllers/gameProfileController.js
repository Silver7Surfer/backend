// controllers/gameProfileController.js
import UserGameProfile from '../models/GameProfile.js';
import Wallet from '../models/Wallet.js';
import mongoose from 'mongoose';

// Request new game profile
export const requestGameProfile = async (req, res) => {
    try {
        const { gameName } = req.body;
        const userId = req.user.userId;

        // Validate game name
        if (!gameName) {
            return res.status(400).json({
                message: 'Game name is required'
            });
        }

        // Find or create user's game profile document
        let userProfile = await UserGameProfile.findOne({ userId });
        
        if (!userProfile) {
            userProfile = new UserGameProfile({
                userId,
                games: []
            });
        }

        // Check if game already exists
        const existingGame = userProfile.games.find(game => game.gameName === gameName);
        if (existingGame) {
            return res.status(400).json({
                message: `You already have a ${gameName} profile`
            });
        }

        // Add new game to the games array
        userProfile.games.push({
            gameName,
            profileStatus: 'pending',
            creditAmount: {
                amount: 0,
                status: 'none',
                requestedAmount: 0
            }
        });

        await userProfile.save();

        res.status(201).json({
            success: true,
            message: 'Game profile request submitted successfully',
            userProfile
        });
    } catch (error) {
        console.error('Game profile request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting game profile',
            error: error.message
        });
    }
};

// Get all game profiles for a user
export const getAllGameProfiles = async (req, res) => {
    try {
        const { userId, role } = req.user;
        
        // If admin, return all users' game profiles
        if (role === 'admin') {
            const allUserProfiles = await UserGameProfile.find().populate('userId', 'username email');
            return res.json({
                success: true,
                isAdmin: true,
                profiles: allUserProfiles
            });
        }
        
        // For regular users, return only their own profiles
        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.json({
                success: true,
                games: []
            });
        }

        res.json({
            success: true,
            games: userProfile.games
        });
    } catch (error) {
        console.error('Get game profiles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching game profiles',
            error: error.message
        });
    }
};

// Admin assigns game ID
export const assignGameId = async (req, res) => {
    try {
        const { userId, gameName, gameId } = req.body;

        // Validate inputs
        if (!userId || !gameName || !gameId) {
            return res.status(400).json({
                success: false,
                message: 'userId, gameName, and gameId are required'
            });
        }

        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
        if (gameIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Game profile not found'
            });
        }

        // Check if game profile is already active
        if (userProfile.games[gameIndex].profileStatus === 'active') {
            return res.status(400).json({
                success: false,
                message: 'Game profile is already active with an assigned gameId',
                existingGameId: userProfile.games[gameIndex].gameId
            });
        }

        // Update game profile
        userProfile.games[gameIndex].gameId = gameId;
        userProfile.games[gameIndex].profileStatus = 'active';
        await userProfile.save();

        res.json({
            success: true,
            message: 'Game ID assigned and profile activated successfully',
            userProfile
        });
    } catch (error) {
        console.error('Game ID assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning game ID',
            error: error.message
        });
    }
};

// User requests credit amount
export const requestCreditAmount = async (req, res) => {
    try {
        const { gameName, amount } = req.body;
        const userId = req.user.userId;

        // Validate inputs
        if (!gameName || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid gameName and amount are required'
            });
        }

        // Check user's wallet balance first
        const userWallet = await Wallet.findOne({ userId });
        if (!userWallet) {
            return res.status(404).json({
                success: false,
                message: 'User wallet not found'
            });
        }

        // Check if user has sufficient balance
        if (userWallet.totalBalanceUSD < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
                currentBalance: userWallet.totalBalanceUSD,
                requestedAmount: amount
            });
        }

        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
        if (gameIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Game profile not found'
            });
        }

        const gameProfile = userProfile.games[gameIndex];

        if (gameProfile.profileStatus !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Game profile must be active to request credit'
            });
        }

        if (gameProfile.creditAmount.status === 'pending') {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending credit request'
            });
        }

        // Start a session for transaction
        const session = await UserGameProfile.startSession();
        session.startTransaction();

        try {
            // Update credit request
            userProfile.games[gameIndex].creditAmount.requestedAmount = amount;
            userProfile.games[gameIndex].creditAmount.status = 'pending';
            await userProfile.save({ session });

            // Update wallet balance and add transaction record
            userWallet.totalBalanceUSD -= amount;
            userWallet.lastUpdated = new Date();
            
            // Add transaction record
            userWallet.transactions.push({
                type: 'game_credit',
                amount: -amount,
                gameName: gameName,
                gameId: gameProfile.gameId,
                status: 'pending',
                description: `Credit request for ${gameName}`,
                timestamp: new Date()
            });

            await userWallet.save({ session });
            await session.commitTransaction();

            res.json({
                success: true,
                message: 'Credit amount requested successfully',
                data: {
                    game: {
                        name: gameName,
                        id: gameProfile.gameId,
                        requestedAmount: amount,
                        status: 'pending'
                    },
                    wallet: {
                        previousBalance: userWallet.totalBalanceUSD + amount,
                        currentBalance: userWallet.totalBalanceUSD,
                        lastUpdated: userWallet.lastUpdated
                    },
                    transaction: userWallet.transactions[userWallet.transactions.length - 1]
                }
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Credit request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting credit amount',
            error: error.message
        });
    }
};

// Admin approves credit amount
export const approveCreditAmount = async (req, res) => {
    try {
        const { userId, gameName } = req.body;

        // Validate inputs
        if (!userId || !gameName) {
            return res.status(400).json({
                success: false,
                message: 'userId and gameName are required'
            });
        }

        // Start a session for transaction
        const session = await UserGameProfile.startSession();
        session.startTransaction();

        try {
            const userProfile = await UserGameProfile.findOne({ userId }).session(session);
            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found'
                });
            }

            const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
            if (gameIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Game profile not found'
                });
            }

            const gameProfile = userProfile.games[gameIndex];

            if (gameProfile.creditAmount.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'No pending credit request found'
                });
            }

            // Find and update wallet transaction
            const userWallet = await Wallet.findOne({ userId }).session(session);
            if (!userWallet) {
                return res.status(404).json({
                    success: false,
                    message: 'User wallet not found'
                });
            }

            // Find the most recent pending transaction for this game
            const transactionIndex = userWallet.transactions.findIndex(tx => 
                tx.type === 'game_credit' && 
                tx.gameName === gameName && 
                tx.status === 'pending'
            );

            if (transactionIndex !== -1) {
                userWallet.transactions[transactionIndex].status = 'completed';
                await userWallet.save({ session });
            }

            // Update credit amount
            userProfile.games[gameIndex].creditAmount.amount = gameProfile.creditAmount.requestedAmount;
            userProfile.games[gameIndex].creditAmount.status = 'success';
            userProfile.games[gameIndex].creditAmount.requestedAmount = 0;
            await userProfile.save({ session });

            await session.commitTransaction();

            res.json({
                success: true,
                message: 'Credit amount approved successfully',
                data: {
                    gameProfile: userProfile.games[gameIndex],
                    transaction: userWallet.transactions[transactionIndex]
                }
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Credit approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving credit amount',
            error: error.message
        });
    }
};

// Request redeem from game
export const requestRedeem = async (req, res) => {
    try {
        const { gameName, amount, tips = 0 } = req.body;
        const userId = req.user.userId;

        // Validate inputs
        if (!gameName || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid gameName and amount are required'
            });
        }

        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
        if (gameIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Game profile not found'
            });
        }

        const gameProfile = userProfile.games[gameIndex];

        if (gameProfile.profileStatus !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Game profile must be active to request redeem'
            });
        }

        // Check if there's already a pending redeem request
        if (gameProfile.creditAmount.status === 'pending_redeem') {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending redeem request'
            });
        }

        // Start a session for transaction
        const session = await UserGameProfile.startSession();
        session.startTransaction();

        try {
            // Update credit request
            userProfile.games[gameIndex].creditAmount.requestedAmount = amount;
            userProfile.games[gameIndex].creditAmount.status = 'pending_redeem';
            await userProfile.save({ session });

            // Find user's wallet
            const userWallet = await Wallet.findOne({ userId }).session(session);
            if (!userWallet) {
                return res.status(404).json({
                    success: false,
                    message: 'User wallet not found'
                });
            }

            // Add transaction record for redeem request
            userWallet.transactions.push({
                type: 'game_withdrawal',
                amount: amount,
                gameName: gameName,
                gameId: gameProfile.gameId,
                status: 'pending',
                description: `Redeem request from ${gameName}`,
                timestamp: new Date(),
                tips: tips || 0
            });

            await userWallet.save({ session });
            await session.commitTransaction();

            res.json({
                success: true,
                message: 'Redeem request submitted successfully',
                data: {
                    game: {
                        name: gameName,
                        id: gameProfile.gameId,
                        requestedAmount: amount,
                        tips: tips,
                        status: 'pending_redeem'
                    },
                    transaction: userWallet.transactions[userWallet.transactions.length - 1]
                }
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Redeem request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting redeem',
            error: error.message
        });
    }
};

// Admin approves redeem request
export const approveRedeem = async (req, res) => {
    try {
        const { userId, gameName } = req.body;

        // Validate inputs
        if (!userId || !gameName) {
            return res.status(400).json({
                success: false,
                message: 'userId and gameName are required'
            });
        }

        // Start a session for transaction
        const session = await UserGameProfile.startSession();
        session.startTransaction();

        try {
            const userProfile = await UserGameProfile.findOne({ userId }).session(session);
            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found'
                });
            }

            const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
            if (gameIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Game profile not found'
                });
            }

            const gameProfile = userProfile.games[gameIndex];

            if (gameProfile.creditAmount.status !== 'pending_redeem') {
                return res.status(400).json({
                    success: false,
                    message: 'No pending redeem request found'
                });
            }

            // Find and update wallet
            const userWallet = await Wallet.findOne({ userId }).session(session);
            if (!userWallet) {
                return res.status(404).json({
                    success: false,
                    message: 'User wallet not found'
                });
            }

            // Find the pending redeem transaction
            const transactionIndex = userWallet.transactions.findIndex(tx => 
                tx.type === 'game_withdrawal' && 
                tx.gameName === gameName && 
                tx.status === 'pending'
            );

            if (transactionIndex !== -1) {
                // Update transaction status
                userWallet.transactions[transactionIndex].status = 'completed';
                
                // Add amount to wallet balance
                const redeemAmount = userWallet.transactions[transactionIndex].amount;
                const tips = userWallet.transactions[transactionIndex].tips || 0;
                const finalAmount = redeemAmount - tips;
                
                userWallet.totalBalanceUSD += finalAmount;
                userWallet.lastUpdated = new Date();

                await userWallet.save({ session });
            }

            // Reset game profile credit amount
            userProfile.games[gameIndex].creditAmount.amount = 0;
            userProfile.games[gameIndex].creditAmount.status = 'none';
            userProfile.games[gameIndex].creditAmount.requestedAmount = 0;
            await userProfile.save({ session });

            await session.commitTransaction();

            res.json({
                success: true,
                message: 'Redeem request approved successfully',
                data: {
                    gameProfile: userProfile.games[gameIndex],
                    transaction: userWallet.transactions[transactionIndex],
                    wallet: {
                        currentBalance: userWallet.totalBalanceUSD,
                        lastUpdated: userWallet.lastUpdated
                    }
                }
            });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Redeem approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving redeem request',
            error: error.message
        });
    }
};

// Initiate withdrawal request
export const initiateWithdraw = async (req, res) => {
    try {
        const { asset, network, address, amount } = req.body;
        const userId = req.user.userId;

        // Input validation
        if (!asset || !address || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Asset, address, and amount are required'
            });
        }

        // Validate asset and network combination
        if (asset === 'usdt' && !network) {
            return res.status(400).json({
                success: false,
                message: 'Network (trc20 or bep20) is required for USDT withdrawal'
            });
        }

        if (asset === 'usdt' && !['trc20', 'bep20'].includes(network)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid network for USDT. Must be trc20 or bep20'
            });
        }

        // Get user's wallet
        const userWallet = await Wallet.findOne({ userId });
        if (!userWallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // Check if user has sufficient balance
        if (userWallet.totalBalanceUSD < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
                data: {
                    requestedAmount: amount,
                    availableBalance: userWallet.totalBalanceUSD
                }
            });
        }

        // Check for any pending withdrawals
        const hasPendingWithdrawal = userWallet.transactions.some(tx => 
            tx.type === 'withdrawal' && 
            tx.status === 'pending'
        );

        if (hasPendingWithdrawal) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending withdrawal request'
            });
        }

        // Start a session for transaction
        const session = await Wallet.startSession();
        session.startTransaction();

        try {
            // Deduct amount from total balance
            userWallet.totalBalanceUSD -= amount;
            userWallet.lastUpdated = new Date();

            // Record withdrawal transaction
            userWallet.transactions.push({
                type: 'withdrawal',
                asset,
                network: asset === 'btc' ? 'btc' : network,
                amount: -amount, // Negative amount for withdrawal
                status: 'pending',
                description: `Withdrawal request of ${amount} ${asset.toUpperCase()} via ${asset === 'btc' ? 'BTC' : network.toUpperCase()}`,
                timestamp: new Date(),
                withdrawalAddress: address
            });

            await userWallet.save({ session });
            await session.commitTransaction();

            res.json({
                success: true,
                message: 'Withdrawal request initiated successfully',
                data: {
                    withdrawal: {
                        asset,
                        network: asset === 'btc' ? 'btc' : network,
                        amount,
                        address,
                        status: 'pending'
                    },
                    wallet: {
                        previousBalance: userWallet.totalBalanceUSD + amount,
                        currentBalance: userWallet.totalBalanceUSD,
                        lastUpdated: userWallet.lastUpdated
                    },
                    transaction: userWallet.transactions[userWallet.transactions.length - 1]
                }
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        console.error('Withdrawal request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initiating withdrawal',
            error: error.message
        });
    }
};

// Get specific game profile
export const getSpecificGameProfile = async (req, res) => {
    try {
        const { gameName } = req.params;
        const userId = req.user.userId;

        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const gameProfile = userProfile.games.find(game => game.gameName === gameName);
        if (!gameProfile) {
            return res.status(404).json({
                success: false,
                message: 'Game profile not found'
            });
        }

        res.json({
            success: true,
            gameProfile
        });
    } catch (error) {
        console.error('Get specific game profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching game profile',
            error: error.message
        });
    }
};

// Admin disapproves credit amount request
export const disapproveCredit = async (req, res) => {
    try {
        const { userId, gameName } = req.body;

        // Validate inputs
        if (!userId || !gameName) {
            return res.status(400).json({
                success: false,
                message: 'userId and gameName are required'
            });
        }

        // Get the user profile and wallet without a session first
        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
        if (gameIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Game profile not found'
            });
        }

        const gameProfile = userProfile.games[gameIndex];

        if (gameProfile.creditAmount.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'No pending credit request found'
            });
        }

        const userWallet = await Wallet.findOne({ userId });
        if (!userWallet) {
            return res.status(404).json({
                success: false,
                message: 'User wallet not found'
            });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the pending credit transaction
            const transactionIndex = userWallet.transactions.findIndex(tx => 
                tx.type === 'game_credit' && 
                tx.gameName === gameName && 
                tx.status === 'pending'
            );

            let refundedAmount = 0;
            if (transactionIndex !== -1) {
                // Mark transaction as rejected
                userWallet.transactions[transactionIndex].status = 'rejected';
                
                // Get the amount to refund (stored as negative in the transaction)
                refundedAmount = Math.abs(userWallet.transactions[transactionIndex].amount);
                
                // Refund amount to wallet balance
                userWallet.totalBalanceUSD += refundedAmount;
                userWallet.lastUpdated = new Date();
            }

            // Reset game profile credit request
            userProfile.games[gameIndex].creditAmount.requestedAmount = 0;
            userProfile.games[gameIndex].creditAmount.status = 'none';
            
            // Save both documents in the transaction
            await UserGameProfile.findOneAndUpdate(
                { _id: userProfile._id },
                { $set: { 
                    [`games.${gameIndex}.creditAmount.requestedAmount`]: 0,
                    [`games.${gameIndex}.creditAmount.status`]: 'none'
                }},
                { session }
            );
            
            await Wallet.findOneAndUpdate(
                { _id: userWallet._id },
                { 
                    $set: { 
                        [`transactions.${transactionIndex}.status`]: 'rejected',
                        totalBalanceUSD: userWallet.totalBalanceUSD,
                        lastUpdated: new Date()
                    }
                },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            res.json({
                success: true,
                message: 'Credit request disapproved and funds refunded',
                data: {
                    gameProfile: userProfile.games[gameIndex],
                    refundedAmount,
                    wallet: {
                        currentBalance: userWallet.totalBalanceUSD,
                        lastUpdated: userWallet.lastUpdated
                    }
                }
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error('Credit disapproval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error disapproving credit request',
            error: error.message
        });
    }
};

// Admin disapproves redeem request
export const disapproveRedeem = async (req, res) => {
    try {
        const { userId, gameName } = req.body;

        // Validate inputs
        if (!userId || !gameName) {
            return res.status(400).json({
                success: false,
                message: 'userId and gameName are required'
            });
        }

        // Get the user profile and wallet without a session first
        const userProfile = await UserGameProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const gameIndex = userProfile.games.findIndex(game => game.gameName === gameName);
        if (gameIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Game profile not found'
            });
        }

        const gameProfile = userProfile.games[gameIndex];

        if (gameProfile.creditAmount.status !== 'pending_redeem') {
            return res.status(400).json({
                success: false,
                message: 'No pending redeem request found'
            });
        }

        const userWallet = await Wallet.findOne({ userId });
        if (!userWallet) {
            return res.status(404).json({
                success: false,
                message: 'User wallet not found'
            });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the pending redeem transaction
            const transactionIndex = userWallet.transactions.findIndex(tx => 
                tx.type === 'game_withdrawal' && 
                tx.gameName === gameName && 
                tx.status === 'pending'
            );

            // Reset game profile redeem request but keep the credit amount
            await UserGameProfile.findOneAndUpdate(
                { _id: userProfile._id },
                { $set: { 
                    [`games.${gameIndex}.creditAmount.requestedAmount`]: 0,
                    [`games.${gameIndex}.creditAmount.status`]: 'none'
                }},
                { session }
            );

            if (transactionIndex !== -1) {
                // Mark transaction as rejected
                await Wallet.findOneAndUpdate(
                    { _id: userWallet._id },
                    { $set: { [`transactions.${transactionIndex}.status`]: 'rejected' }},
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();

            res.json({
                success: true,
                message: 'Redeem request disapproved successfully',
                data: {
                    gameProfile: {
                        ...userProfile.games[gameIndex].toObject(),
                        creditAmount: {
                            ...userProfile.games[gameIndex].creditAmount.toObject(),
                            requestedAmount: 0,
                            status: 'none'
                        }
                    }
                }
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error('Redeem disapproval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error disapproving redeem request',
            error: error.message
        });
    }
};