const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const News = require('../models/News');
const Achievement = require('../models/Achievement');
const { adminOnly } = require('../middleware/auth');

const router = express.Router();

// Apply admin-only middleware to all routes
router.use(adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalStudents,
            totalTeachers,
            totalNews,
            totalAchievements,
            recentStudents,
            recentNews
        ] = await Promise.all([
            User.countDocuments({ role: 'student', isActive: true }),
            User.countDocuments({ role: 'teacher', isActive: true }),
            News.countDocuments({ isPublished: true }),
            Achievement.countDocuments({ isPublished: true }),
            User.find({ role: 'student', isActive: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name studentId class section createdAt'),
            News.find({ isPublished: true })
                .sort({ publishedAt: -1 })
                .limit(5)
                .select('title category publishedAt views')
                .populate('author', 'name')
        ]);

        const stats = {
            totalStudents,
            totalTeachers,
            totalNews,
            totalAchievements,
            recentStudents,
            recentNews
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin)
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const role = req.query.role;
        const search = req.query.search;
        const isActive = req.query.isActive;

        const query = {};
        
        if (role) {
            query.role = role;
        }
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { teacherId: { $regex: search, $options: 'i' } },
                { adminId: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/users', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role')
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
            message: 'User created successfully',
            data: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:id', async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Don't allow password update through this route

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete by setting isActive to false)
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/content
// @desc    Get all content (news, achievements) for management
// @access  Private (Admin)
router.get('/content', async (req, res) => {
    try {
        const [news, achievements] = await Promise.all([
            News.find({})
                .populate('author', 'name')
                .sort({ createdAt: -1 })
                .limit(20),
            Achievement.find({})
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .limit(20)
        ]);

        res.json({
            success: true,
            data: {
                news,
                achievements
            }
        });

    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/reports
// @desc    Get various reports and analytics
// @access  Private (Admin)
router.get('/reports', async (req, res) => {
    try {
        // Student enrollment by class
        const enrollmentByClass = await User.aggregate([
            { $match: { role: 'student', isActive: true } },
            { $group: { _id: '$class', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRegistrations = await User.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: thirtyDaysAgo },
                    isActive: true 
                } 
            },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Content statistics
        const contentStats = await Promise.all([
            News.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Achievement.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                enrollmentByClass,
                recentRegistrations,
                newsCategories: contentStats[0],
                achievementCategories: contentStats[1]
            }
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;