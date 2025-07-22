const express = require('express');
const router = express.Router();

// Mock auth routes for testing
router.post('/login', (req, res) => {
    res.json({
        success: true,
        message: 'Login endpoint (mock)',
        token: 'mock-jwt-token',
        user: { id: 1, name: 'Test User', role: 'student' }
    });
});

router.get('/me', (req, res) => {
    res.json({
        success: true,
        user: { id: 1, name: 'Test User', role: 'student' }
    });
});

module.exports = router;
