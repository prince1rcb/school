const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Static announcements for now
const announcements = [
    {
        _id: '1',
        text: 'Latest: EMRS Entrance Exam 2024 applications now open! Apply before December 31st.',
        isActive: true,
        priority: 1,
        createdAt: new Date()
    },
    {
        _id: '2',
        text: 'Annual Sports Day scheduled for December 15th, 2024. All students participation mandatory.',
        isActive: true,
        priority: 2,
        createdAt: new Date()
    },
    {
        _id: '3',
        text: 'Winter vacation starts from December 20th to January 5th, 2025.',
        isActive: true,
        priority: 3,
        createdAt: new Date()
    },
    {
        _id: '4',
        text: 'New batch of Class VI admissions open. Limited seats available.',
        isActive: true,
        priority: 4,
        createdAt: new Date()
    },
    {
        _id: '5',
        text: 'Parent-Teacher meeting scheduled for December 10th, 2024.',
        isActive: true,
        priority: 5,
        createdAt: new Date()
    }
];

// @route   GET /api/announcements
// @desc    Get all active announcements
// @access  Public
router.get('/', async (req, res) => {
    try {
        const activeAnnouncements = announcements
            .filter(announcement => announcement.isActive)
            .sort((a, b) => a.priority - b.priority);

        res.json({
            success: true,
            data: activeAnnouncements
        });

    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;