const express = require('express');
const { body, validationResult } = require('express-validator');
const News = require('../models/News');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/news
// @desc    Get all published news
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const featured = req.query.featured;

        const query = { isPublished: true };
        
        if (category) {
            query.category = category;
        }
        
        if (featured) {
            query.featured = featured === 'true';
        }

        const news = await News.find(query)
            .populate('author', 'name')
            .sort({ publishedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await News.countDocuments(query);

        res.json({
            success: true,
            data: news,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/news/:id
// @desc    Get single news item
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const news = await News.findById(req.params.id)
            .populate('author', 'name');

        if (!news || !news.isPublished) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        // Increment views
        await news.incrementViews();

        res.json({
            success: true,
            data: news
        });

    } catch (error) {
        console.error('Get news item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/news
// @desc    Create news item
// @access  Private (Teacher/Admin)
router.post('/', authMiddleware, [
    body('title').notEmpty().withMessage('Title is required'),
    body('excerpt').notEmpty().withMessage('Excerpt is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('image').notEmpty().withMessage('Image is required'),
    body('category').isIn(['news', 'event', 'announcement', 'achievement']).withMessage('Invalid category')
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

        const newsData = {
            ...req.body,
            author: req.user._id
        };

        const news = new News(newsData);
        await news.save();

        await news.populate('author', 'name');

        res.status(201).json({
            success: true,
            message: 'News created successfully',
            data: news
        });

    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/news/:id
// @desc    Update news item
// @access  Private (Author/Admin)
router.put('/:id', authMiddleware, [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('excerpt').optional().notEmpty().withMessage('Excerpt cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('category').optional().isIn(['news', 'event', 'announcement', 'achievement']).withMessage('Invalid category')
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

        const news = await News.findById(req.params.id);

        if (!news) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        // Check if user can edit this news
        if (req.user.role !== 'admin' && news.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const updatedNews = await News.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('author', 'name');

        res.json({
            success: true,
            message: 'News updated successfully',
            data: updatedNews
        });

    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/news/:id
// @desc    Delete news item
// @access  Private (Author/Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const news = await News.findById(req.params.id);

        if (!news) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        // Check if user can delete this news
        if (req.user.role !== 'admin' && news.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await News.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'News deleted successfully'
        });

    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;