const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'emrs-dornala-secret-key';

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('userType').isIn(['student', 'teacher', 'admin']).withMessage('Invalid user type'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { userType, password } = req.body;
        let identifier;

        // Get identifier based on user type
        switch (userType) {
            case 'student':
                identifier = req.body.studentId;
                break;
            case 'teacher':
                identifier = req.body.teacherId;
                break;
            case 'admin':
                identifier = req.body.adminId;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user type'
                });
        }

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: `${userType} ID is required`
            });
        }

        // Find user by credentials
        const user = await User.findByCredentials(identifier, password, userType);

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error.message || 'Invalid credentials'
        });
    }
});

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private (Admin)
router.post('/register', authMiddleware, [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role')
], async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can register new users'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const userData = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User(userData);

        // Generate user ID based on role
        const userId = user.generateUserId();
        switch (user.role) {
            case 'student':
                user.studentId = userId;
                break;
            case 'teacher':
                user.teacherId = userId;
                break;
            case 'admin':
                user.adminId = userId;
                break;
        }

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().matches(/^\d{10}$/).withMessage('Valid 10-digit phone number required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const updates = req.body;
        delete updates.password; // Don't allow password update here
        delete updates.role; // Don't allow role update
        delete updates.studentId; // Don't allow ID updates
        delete updates.teacherId;
        delete updates.adminId;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during profile update'
        });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id);

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
        // Generate token
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user.getPublicProfile()))}`);
    }
);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token on client side)
// @access  Private
router.post('/logout', authMiddleware, (req, res) => {
    // In a more advanced setup, you might maintain a blacklist of tokens
    // For now, we'll just send a success response
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                success: true,
                message: 'If your email is registered, you will receive a password reset link'
            });
        }

        // In a real application, you would:
        // 1. Generate a reset token
        // 2. Save it to the user record with expiration
        // 3. Send email with reset link
        
        // For now, just send success response
        res.json({
            success: true,
            message: 'If your email is registered, you will receive a password reset link'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;