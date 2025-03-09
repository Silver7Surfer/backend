import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    profileImage: {
        type: Buffer,
        required: true
    },
    profileImageType: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    assignedAdmin: {
        type: String,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries by assigned admin
userSchema.index({ assignedAdmin: 1 });

export default mongoose.model('User', userSchema);