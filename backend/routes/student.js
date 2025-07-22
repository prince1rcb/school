const express = require('express');
const User = require('../models/User');
const { studentOnly } = require('../middleware/auth');

const router = express.Router();

// Apply student-only middleware to all routes
router.use(studentOnly);

// @route   GET /api/student/dashboard
// @desc    Get student dashboard
// @access  Private (Student)
router.get('/dashboard', async (req, res) => {
    try {
        const student = req.user;

        // Mock data for results and schedule
        const mockResults = [
            { subject: 'Mathematics', marks: 85, total: 100, grade: 'A' },
            { subject: 'Science', marks: 78, total: 100, grade: 'B+' },
            { subject: 'English', marks: 82, total: 100, grade: 'A-' },
            { subject: 'Social Studies', marks: 88, total: 100, grade: 'A' }
        ];

        const mockSchedule = [
            { time: '09:00-09:45', subject: 'Mathematics', teacher: 'Mr. Kumar' },
            { time: '10:00-10:45', subject: 'Science', teacher: 'Mrs. Sharma' },
            { time: '11:00-11:45', subject: 'English', teacher: 'Ms. Patel' }
        ];

        const stats = {
            student: {
                name: student.name,
                studentId: student.studentId,
                class: student.class,
                section: student.section,
                rollNumber: student.rollNumber,
                hostelRoom: student.hostelRoom
            },
            recentResults: mockResults,
            todaySchedule: mockSchedule
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/student/results
// @desc    Get student's academic results
// @access  Private (Student)
router.get('/results', async (req, res) => {
    try {
        // Mock results data - in real app, this would come from a Results model
        const results = {
            currentTerm: 'Term 1 - 2024',
            subjects: [
                {
                    subject: 'Mathematics',
                    tests: [
                        { name: 'Unit Test 1', marks: 18, total: 20, date: '2024-01-15' },
                        { name: 'Mid Term', marks: 42, total: 50, date: '2024-02-15' },
                        { name: 'Unit Test 2', marks: 25, total: 30, date: '2024-03-01' }
                    ],
                    totalMarks: 85,
                    totalPossible: 100,
                    grade: 'A'
                },
                {
                    subject: 'Science',
                    tests: [
                        { name: 'Unit Test 1', marks: 16, total: 20, date: '2024-01-18' },
                        { name: 'Mid Term', marks: 38, total: 50, date: '2024-02-18' },
                        { name: 'Unit Test 2', marks: 24, total: 30, date: '2024-03-05' }
                    ],
                    totalMarks: 78,
                    totalPossible: 100,
                    grade: 'B+'
                }
            ],
            overallPercentage: 81.5,
            overallGrade: 'A',
            rank: 5,
            totalStudents: 45
        };

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/student/schedule
// @desc    Get student's class schedule
// @access  Private (Student)
router.get('/schedule', async (req, res) => {
    try {
        // Mock schedule data
        const schedule = [
            {
                day: 'Monday',
                periods: [
                    { time: '09:00-09:45', subject: 'Mathematics', teacher: 'Mr. Kumar', room: 'Room 101' },
                    { time: '10:00-10:45', subject: 'Science', teacher: 'Mrs. Sharma', room: 'Lab 1' },
                    { time: '11:00-11:45', subject: 'English', teacher: 'Ms. Patel', room: 'Room 102' },
                    { time: '12:00-12:45', subject: 'Social Studies', teacher: 'Mr. Singh', room: 'Room 103' },
                    { time: '14:00-14:45', subject: 'Hindi', teacher: 'Mrs. Gupta', room: 'Room 104' },
                    { time: '15:00-15:45', subject: 'Computer Science', teacher: 'Mr. Reddy', room: 'Computer Lab' }
                ]
            },
            {
                day: 'Tuesday',
                periods: [
                    { time: '09:00-09:45', subject: 'Science', teacher: 'Mrs. Sharma', room: 'Lab 1' },
                    { time: '10:00-10:45', subject: 'Mathematics', teacher: 'Mr. Kumar', room: 'Room 101' },
                    { time: '11:00-11:45', subject: 'Hindi', teacher: 'Mrs. Gupta', room: 'Room 104' },
                    { time: '12:00-12:45', subject: 'English', teacher: 'Ms. Patel', room: 'Room 102' },
                    { time: '14:00-14:45', subject: 'Physical Education', teacher: 'Mr. Rao', room: 'Sports Ground' },
                    { time: '15:00-15:45', subject: 'Art', teacher: 'Ms. Joshi', room: 'Art Room' }
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

// @route   GET /api/student/hostel
// @desc    Get student's hostel information
// @access  Private (Student)
router.get('/hostel', async (req, res) => {
    try {
        const student = req.user;

        // Mock hostel data
        const hostelInfo = {
            roomNumber: student.hostelRoom || 'A-101',
            blockName: 'A Block',
            roommates: [
                { name: 'Ravi Kumar', studentId: 'STU20240001', class: student.class },
                { name: 'Suresh Patel', studentId: 'STU20240002', class: student.class }
            ],
            warden: {
                name: 'Mrs. Lakshmi',
                phone: '+91 98765 43210',
                email: 'warden@emrsdornala.edu.in'
            },
            facilities: [
                'Wi-Fi Available',
                '24/7 Security',
                'Common Room',
                'Study Hall',
                'Medical Facility',
                'Mess Hall'
            ],
            rules: [
                'Lights out at 10:00 PM',
                'No outside food allowed',
                'Visitors allowed only on weekends',
                'Maintain cleanliness',
                'Report any issues to warden'
            ]
        };

        res.json({
            success: true,
            data: hostelInfo
        });

    } catch (error) {
        console.error('Get hostel info error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/student/profile
// @desc    Get student's detailed profile
// @access  Private (Student)
router.get('/profile', async (req, res) => {
    try {
        const student = req.user;

        const profileData = {
            personal: {
                name: student.name,
                studentId: student.studentId,
                email: student.email,
                phone: student.phone,
                dateOfBirth: student.dateOfBirth,
                bloodGroup: student.bloodGroup,
                address: student.address
            },
            academic: {
                class: student.class,
                section: student.section,
                rollNumber: student.rollNumber,
                admissionDate: student.admissionDate
            },
            guardian: {
                name: student.guardianName,
                phone: student.guardianPhone,
                email: student.guardianEmail
            },
            hostel: {
                roomNumber: student.hostelRoom,
                block: 'A Block'
            }
        };

        res.json({
            success: true,
            data: profileData
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;