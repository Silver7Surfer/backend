import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    gameName: {
        type: String,
        required: true,
        enum: ['Firekirin', 'Juwa', 'OrionStar', 'CashMachine', 'GameVault', 'YoLo', 'MilkyWay', 'PandaMaster'],
        trim: true
    },
    gameId: {
        type: String,
        default: null
    },
    profileStatus: {
        type: String,
        enum: ['pending', 'active'],
        default: 'pending'
    },
    creditAmount: {
        amount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['none', 'pending', 'success', 'pending_redeem'],
            default: 'none'
        },
        requestedAmount: {
            type: Number,
            default: 0
        }
    }
}, { timestamps: true });

const userGameProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    games: [gameSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('UserGameProfile', userGameProfileSchema);