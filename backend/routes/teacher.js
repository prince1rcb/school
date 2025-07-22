const express = require('express');
const User = require('../models/User');
const { teacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply teacher/admin middleware to all routes
router.use(teacherOrAdmin);

// @route   GET /api/teacher/dashboard
// @desc    Get teacher dashboard
// @access  Private (Teacher/Admin)
router.get('/dashboard', async (req, res) => {
    try {
        const teacher = req.user;
        
        // Get students in teacher's classes
        const students = await User.find({
            role: 'student',
            isActive: true,
            $or: teacher.classes?.map(cls => ({
                class: cls.class,
                section: cls.section
            })) || []
        }).select('name studentId class section');

        const stats = {
            totalStudents: students.length,
            classes: teacher.classes || [],
            subjects: teacher.subjects || [],
            students: students.slice(0, 10) // Show first 10 students
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/teacher/students
// @desc    Get students assigned to teacher
// @access  Private (Teacher/Admin)
router.get('/students', async (req, res) => {
    try {
        const teacher = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const classFilter = req.query.class;
        const sectionFilter = req.query.section;

        let query = {
            role: 'student',
            isActive: true
        };

        // If specific class/section is requested
        if (classFilter && sectionFilter) {
            query.class = classFilter;
            query.section = sectionFilter;
        } else if (teacher.classes && teacher.classes.length > 0) {
            // Get students from teacher's classes
            query.$or = teacher.classes.map(cls => ({
                class: cls.class,
                section: cls.section
            }));
        }

        const students = await User.find(query)
            .select('name studentId class section rollNumber email phone')
            .sort({ class: 1, section: 1, rollNumber: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: students,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/teacher/schedule
// @desc    Get teacher's class schedule
// @access  Private (Teacher/Admin)
router.get('/schedule', async (req, res) => {
    try {
        // Mock schedule data - in real app, this would come from a Schedule model
        const schedule = [
            {
                day: 'Monday',
                periods: [
                    { time: '09:00-09:45', subject: 'Mathematics', class: 'X', section: 'A' },
                    { time: '10:00-10:45', subject: 'Mathematics', class: 'X', section: 'B' },
                    { time: '11:00-11:45', subject: 'Mathematics', class: 'IX', section: 'A' }
                ]
            },
            {
                day: 'Tuesday',
                periods: [
                    { time: '09:00-09:45', subject: 'Mathematics', class: 'IX', section: 'B' },
                    { time: '10:00-10:45', subject: 'Mathematics', class: 'X', section: 'A' },
                    { time: '11:00-11:45', subject: 'Mathematics', class: 'X', section: 'B' }
                ]
            }
        ];

        res.json({
            success: true,
            data: schedule
        });

    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;