const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalStudents: 45,
            classes: ['X-A', 'X-B'],
            subjects: ['Mathematics']
        }
    });
});

module.exports = router;
