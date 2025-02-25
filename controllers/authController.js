import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import { getRandomProfileImage } from '../utils/profileImageHandler.js'

import crypto from 'crypto';
import { sendEmail } from '../utils/emailService.js';
import { generateVerificationEmail } from '../templates/verificationEmail.js';
import { generateResetPasswordEmail } from '../templates/resetPasswordEmail.js';
import { generateWalletAddresses } from '../utils/walletGeneration.js';

// Modify the existing register function to include email verification
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const assignedRole = req.body.role || 'user';

        // Check existing user...
        const existingEmail = await User.findOne({ email });
        const existingUsername = await User.findOne({ username });

        if (existingEmail || existingUsername) {
            return res.status(400).json({
                message: 'Registration failed',
                errors: {
                    email: existingEmail ? 'Email is already registered' : null,
                    username: existingUsername ? 'Username is already taken' : null
                }
            });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const profileImage = await getRandomProfileImage();


        
        // Create new user with verification token
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires,
            profileImage: profileImage.buffer,
            profileImageType: profileImage.type,
            role: assignedRole
        });

        const savedUser = await newUser.save();
        const profileImageBase64 = savedUser.profileImage.toString('base64');

        // Send verification email
        const emailSent = await sendEmail(
            email,
            'Verify Your Email',
            generateVerificationEmail(verificationToken)
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: savedUser._id , role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            token,
            emailSent,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                isVerified: savedUser.isVerified,
                role: savedUser.role,
                profileImage: `data:${savedUser.profileImageType};base64,${profileImageBase64}`
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Modify the existing login function to check verification
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );


        const profileImageBase64 = user.profileImage.toString('base64');
        // Send response
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                lastLogin: user.lastLogin,
                isVerified: user.isVerified,
                role:user.role,
                profileImage: `data:${user.profileImageType};base64,${profileImageBase64}`
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Error logging in', 
            error: error.message 
        });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/verify-email/error`);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        try {
            // Check if wallet already exists
            const existingWallet = await Wallet.findOne({ userId: user._id });
            let wallet = existingWallet;
            
            if (!existingWallet) {
                const { btcAddress, usdtTrc20Address, usdtBep20Address } = generateWalletAddresses();
                wallet = new Wallet({
                    userId: user._id,
                    btc: {
                        address: btcAddress,
                        balance: 0
                    },
                    usdt: {
                        trc20: {
                            address: usdtTrc20Address,
                            balance: 0
                        },
                        bep20: {
                            address: usdtBep20Address,
                            balance: 0
                        }
                    }
                });
                await wallet.save();
            }

            // Redirect to frontend with success and wallet data
            const walletData = encodeURIComponent(JSON.stringify({
                btc: wallet.btc,
                usdt: wallet.usdt
            }));
            return res.redirect(`${process.env.FRONTEND_URL}/verify-email/success?wallet=${walletData}`);

        } catch (walletError) {
            console.error('Wallet creation error:', walletError);
            return res.redirect(`${process.env.FRONTEND_URL}/verify-email/success?wallet=failed`);
        }
    } catch (error) {
        console.error('Email verification error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/verify-email/error`);
    }
};

export const resendVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;
        await user.save();

        // Send new verification email
        const emailSent = await sendEmail(
            user.email,
            'Verify Your Email',
            generateVerificationEmail(verificationToken)
        );

        res.json({ 
            message: 'Verification email resent successfully',
            emailSent
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Error resending verification email', error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log('resetToken:', resetToken);
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.findOneAndUpdate(
            { _id: user._id },
            {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpires
            },
            { 
                runValidators: false, // Important: Don't run validators
                new: true 
            }
        );

        // Send reset password email
        const emailSent = await sendEmail(
            email,
            'Reset Your Password',
            generateResetPasswordEmail(resetToken)
        );

        res.json({ 
            message: 'Password reset email sent successfully',
            emailSent
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing forgot password request', error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};