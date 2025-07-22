const express = require('express');
const { body, validationResult } = require('express-validator');
const Achievement = require('../models/Achievement');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/achievements
// @desc    Get all published achievements
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const level = req.query.level;
        const featured = req.query.featured;

        const query = { isPublished: true };
        
        if (category) {
            query.category = category;
        }
        
        if (level) {
            query.level = level;
        }
        
        if (featured) {
            query.featured = featured === 'true';
        }

        const achievements = await Achievement.find(query)
            .populate('createdBy', 'name')
            .populate('participants.student', 'name class section')
            .populate('teachers', 'name')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Achievement.countDocuments(query);

        res.json({
            success: true,
            data: achievements,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/achievements/:id
// @desc    Get single achievement
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('participants.student', 'name class section')
            .populate('teachers', 'name');

        if (!achievement || !achievement.isPublished) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found'
            });
        }

        res.json({
            success: true,
            data: achievement
        });

    } catch (error) {
        console.error('Get achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/achievements
// @desc    Create achievement
// @access  Private (Teacher/Admin)
router.post('/', authMiddleware, [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('image').notEmpty().withMessage('Image is required'),
    body('category').isIn(['academic', 'sports', 'cultural', 'science', 'recognition', 'other']).withMessage('Invalid category'),
    body('level').isIn(['school', 'district', 'state', 'national', 'international']).withMessage('Invalid level'),
    body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
    try {
        // Check if user has permission
        if (!['teacher', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
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

        const achievementData = {
            ...req.body,
            createdBy: req.user._id
        };

        const achievement = new Achievement(achievementData);
        await achievement.save();

        await achievement.populate([
            { path: 'createdBy', select: 'name' },
            { path: 'participants.student', select: 'name class section' },
            { path: 'teachers', select: 'name' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Achievement created successfully',
            data: achievement
        });

    } catch (error) {
        console.error('Create achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/achievements/:id
// @desc    Update achievement
// @access  Private (Creator/Admin)
router.put('/:id', authMiddleware, [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional().isIn(['academic', 'sports', 'cultural', 'science', 'recognition', 'other']).withMessage('Invalid category'),
    body('level').optional().isIn(['school', 'district', 'state', 'national', 'international']).withMessage('Invalid level'),
    body('date').optional().isISO8601().withMessage('Valid date is required')
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

        const achievement = await Achievement.findById(req.params.id);

        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found'
            });
        }

        // Check if user can edit this achievement
        if (req.user.role !== 'admin' && achievement.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const updatedAchievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate([
            { path: 'createdBy', select: 'name' },
            { path: 'participants.student', select: 'name class section' },
            { path: 'teachers', select: 'name' }
        ]);

        res.json({
            success: true,
            message: 'Achievement updated successfully',
            data: updatedAchievement
        });

    } catch (error) {
        console.error('Update achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/achievements/:id
// @desc    Delete achievement
// @access  Private (Creator/Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id);

        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found'
            });
        }

        // Check if user can delete this achievement
        if (req.user.role !== 'admin' && achievement.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await Achievement.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Achievement deleted successfully'
        });

    } catch (error) {
        console.error('Delete achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;