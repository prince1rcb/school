const express = require('express');
const router = express.Router();

// Mock achievements data
const achievementsData = [
    {
        _id: '1',
        title: 'State Level Academic Excellence Award',
        description: 'EMRS Dornala received the State Level Academic Excellence Award for outstanding performance.',
        image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        category: 'Academic',
        date: '2024-11-20'
    },
    {
        _id: '2',
        title: 'District Sports Championship',
        description: 'Our athletics team won the overall championship at the district level sports meet.',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        category: 'Sports',
        date: '2024-11-05'
    }
];

router.get('/', (req, res) => {
    res.json({
        success: true,
        data: achievementsData
    });
});

module.exports = router;
