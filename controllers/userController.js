// controllers/userController.js
import User from '../models/User.js';

export const getUserData = async (req, res) => {
    try {
        const userId = req.user.userId; // From auth middleware

        const user = await User.findById(userId)
            .select('-password -verificationToken -verificationTokenExpires'); // Exclude sensitive data

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Convert profile image to base64
        const profileImageBase64 = user.profileImage.toString('base64');

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                profileImage: `data:${user.profileImageType};base64,${profileImageBase64}`,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};