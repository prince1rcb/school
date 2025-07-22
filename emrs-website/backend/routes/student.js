const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            student: {
                name: 'Test Student',
                studentId: 'STU20240001',
                class: 'X',
                section: 'A'
            },
            recentResults: [
                { subject: 'Mathematics', marks: 85, total: 100, grade: 'A' }
            ]
        }
    });
});

module.exports = router;
