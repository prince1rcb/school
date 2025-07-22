const express = require('express');
const router = express.Router();

// Mock news data
const newsData = [
    {
        _id: '1',
        title: 'EMRS Entrance Exam 2024 Applications Open',
        excerpt: 'Applications for EMRS entrance examination are now open. Last date for submission is December 31st, 2024.',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        date: '2024-12-01'
    },
    {
        _id: '2',
        title: 'Annual Sports Day Celebration',
        excerpt: 'Students showcased their athletic talents in various sports competitions held at our school grounds.',
        image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        date: '2024-11-15'
    }
];

router.get('/', (req, res) => {
    res.json({
        success: true,
        data: newsData
    });
});

module.exports = router;
