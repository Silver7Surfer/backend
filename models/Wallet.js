// models/Wallet.js
import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalBalanceUSD: {
        type: Number,
        default: 0
    },
    lastResetDate: {
        type: Date,
        default: Date.now
    },
    btc: {
        address: {
            type: String,
            required: true,
            unique: true
        },
        balance: {
            type: Number,
            default: 0
        }
    },
    usdt: {
        trc20: {
            address: {
                type: String,
                required: true,
                unique: true
            },
            balance: {
                type: Number,
                default: 0
            }
        },
        bep20: {
            address: {
                type: String,
                required: true,
                unique: true
            },
            balance: {
                type: Number,
                default: 0
            }
        }
    },
    transactions:  [{
        type: {
            type: String,
            enum: ['deposit', 'game_credit', 'game_withdrawal', 'withdrawal'],
            required: true
        },
        asset: {
            type: String,
            enum: ['btc', 'usdt', null],
            default: null
        },
        network: {
            type: String,
            enum: ['btc', 'trc20', 'bep20', null],
            default: null
        },
        amount: {
            type: Number,
            required: true
        },
        gameName: {
            type: String,
            default: null
        },
        gameId: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'rejected'],
            default: 'completed'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        txHash: {
            type: String,
            default: null
        },
        description: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdAt : {
        type: Date,
        default: Date.now
    }
});

walletSchema.methods.processDeposit = async function(asset, network, amount, txHash) {
    // Update the specific wallet balance
    if (asset === 'btc') {
        this.btc.balance += amount;
        this.totalBalanceUSD += amount;
    } else if (asset === 'usdt') {
        if (network === 'trc20') {
            this.usdt.trc20.balance += amount;
            this.totalBalanceUSD += amount;
        } else if (network === 'bep20') {
            this.usdt.bep20.balance += amount;
            this.totalBalanceUSD += amount;
        }
    }
    
    // Record transaction
    this.transactions.push({
        type: 'deposit',
        asset,
        network,
        amount,
        status: 'completed',
        txHash,
        description: `Deposit of ${amount} ${asset.toUpperCase()} via ${network.toUpperCase()}`
    });
    
    this.lastUpdated = Date.now();
    return await this.save();
};

export default mongoose.model('Wallet', walletSchema);