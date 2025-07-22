const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalStudents: 250,
            totalTeachers: 25,
            totalNews: 15,
            totalAchievements: 10
        }
    });
});

module.exports = router;
