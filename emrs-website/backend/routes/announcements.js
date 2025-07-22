const express = require('express');
const router = express.Router();

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
    }
];

router.get('/', (req, res) => {
    res.json({
        success: true,
        data: announcements
    });
});

module.exports = router;
