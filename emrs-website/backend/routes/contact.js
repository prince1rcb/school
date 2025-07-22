const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    console.log('Contact form submission:', req.body);
    res.json({
        success: true,
        message: 'Message sent successfully! We will get back to you soon.'
    });
});

module.exports = router;
