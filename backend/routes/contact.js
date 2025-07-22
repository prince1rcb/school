const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
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

        const { name, email, subject, message } = req.body;

        // In a real application, you would:
        // 1. Save to database
        // 2. Send email notification to admin
        // 3. Send confirmation email to user
        
        console.log('Contact form submission:', {
            name,
            email,
            subject,
            message,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;