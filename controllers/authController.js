import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import UserLocation from '../models/UserLocation.js';
import geoip from 'geoip-lite';
import {UAParser} from 'ua-parser-js';
import { getRandomProfileImage } from '../utils/profileImageHandler.js'

import crypto from 'crypto';
import { sendEmail } from '../utils/emailService.js';
import { generateVerificationEmail } from '../templates/verificationEmail.js';
import { generateResetPasswordEmail } from '../templates/resetPasswordEmail.js';
import { generateWalletAddresses } from '../utils/walletGeneration.js';



const getLocationData = (req) => {
    // Extract IP address, handling both IPv4 and IPv6
    let ipString = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // If there are multiple IPs, take the first one (client's IP)
    let ip = ipString.split(',')[0].trim();
    
    // Clean up the IP address
    if (ip.includes('::ffff:')) {
      // Convert IPv6 format of IPv4 to standard IPv4
      ip = ip.replace('::ffff:', '');
    }
    
    // Try to get geo data
    let geo = null;
    try {
      geo = geoip.lookup(ip);
      // If first IP fails, try others
      if (!geo && ipString.includes(',')) {
        const ips = ipString.split(',');
        for (let i = 1; i < ips.length; i++) {
          const alternateIp = ips[i].trim();
          geo = geoip.lookup(alternateIp);
          if (geo) {
            ip = alternateIp; // Use the IP that worked
            break;
          }
        }
      }
    } catch (error) {
      console.error('Geolocation lookup error:', error);
    }
    
    geo = geo || {}; // Ensure geo is an object even if lookup failed
    
    // Parse user agent
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();
    const deviceInfo = parser.getDevice();
    
    return {
      ip,
      location: {
        country: geo.country || null,
        city: geo.city || null,
        region: geo.region || null,
        coordinates: {
          lat: geo.ll ? geo.ll[0] : null,
          lng: geo.ll ? geo.ll[1] : null
        }
      },
      deviceInfo: {
        userAgent: userAgent || null,
        browser: browserInfo.name ? `${browserInfo.name} ${browserInfo.version || ''}` : null,
        os: osInfo.name ? `${osInfo.name} ${osInfo.version || ''}` : null,
        deviceType: (deviceInfo && deviceInfo.type) || 'unknown'
      }
    };
  };
// Modify the existing register function to include email verification
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const assignedRole = req.body.role || 'user';

        // Check existing user
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

        // Record registration location
        try {
            const locationData = getLocationData(req);
            await UserLocation.create({
                userId: savedUser._id,
                email: savedUser.email,
                ...locationData,
                status: 'registration'
            });
        } catch (locationError) {
            console.error('Error recording registration location:', locationError);
            // Continue with registration even if location recording fails
        }

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
        const locationData = getLocationData(req);

        // Find user by email
        const user = await User.findOne({ email });
        
        // Handle non-existent user
        if (!user) {
            try {
                // Record failed login attempt without userId
                await UserLocation.create({
                    email: email, // Store the attempted email
                    ...locationData,
                    status: 'failed'
                });
            } catch (locationError) {
                console.error('Error recording failed login location:', locationError);
            }
            
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            try {
                await UserLocation.create({
                    userId: user._id,
                    email: user.email,
                    ...locationData,
                    status: 'failed'
                });
            } catch (locationError) {
                console.error('Error recording failed login location:', locationError);
            }
            
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check if account is active
        if (!user.isActive) {
            try {
                await UserLocation.create({
                    userId: user._id,
                    email: user.email,
                    ...locationData,
                    status: 'failed'
                });
            } catch (locationError) {
                console.error('Error recording failed login location:', locationError);
            }
            
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            try {
                await UserLocation.create({
                    userId: user._id,
                    email: user.email,
                    ...locationData,
                    status: 'failed'
                });
            } catch (locationError) {
                console.error('Error recording failed login location:', locationError);
            }
            
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

        // Record successful login
        try {
            await UserLocation.create({
                userId: user._id,
                email: user.email,
                ...locationData,
                status: 'success'
            });
        } catch (locationError) {
            console.error('Error recording successful login location:', locationError);
            // Continue login process even if location recording fails
        }

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
                role: user.role,
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
                const { btcAddress, usdtTrc20Address, usdtBep20Address } = await generateWalletAddresses();
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

export const isLoggedin = async (req, res) => {
    try {
        // Ensure userId is correct, adjust based on JWT payload
        const userId = req.user.userId || req.user.id; 
    
        if (!userId) {
          return res.status(401).json({ message: "Invalid token, user ID missing" });
        }
    
        const user = await User.findById(userId).select("-password");
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        res.json({ isAuthenticated: true, user });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
      }
};