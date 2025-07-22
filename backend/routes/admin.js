const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const StudyMaterial = require('../models/StudyMaterial');
const { authenticate, isAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendWelcomeEmail, sendNotificationEmail } = require('../utils/emailService');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(isAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    activeAnnouncements,
    upcomingEvents,
    recentResults,
    attendanceToday
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Class.countDocuments({ isActive: true }),
    Subject.countDocuments({ isActive: true }),
    Announcement.countDocuments({ isActive: true, isPublished: true }),
    Event.countDocuments({ 
      startDate: { $gte: new Date() }, 
      status: 'published' 
    }),
    Result.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    }),
    Attendance.countDocuments({ 
      date: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      } 
    })
  ]);

  // Get recent activities
  const recentUsers = await User.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName role createdAt');

  const recentAnnouncements = await Announcement.find({ 
    isActive: true, 
    isPublished: true 
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('author', 'firstName lastName');

  // Get class-wise student distribution
  const classDistribution = await User.aggregate([
    { $match: { role: 'student', isActive: true } },
    { $group: { _id: '$academic.class', count: { $sum: 1 } } },
    { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    { $project: { className: '$class.name', grade: '$class.grade', count: 1 } },
    { $sort: { grade: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      statistics: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        activeAnnouncements,
        upcomingEvents,
        recentResults,
        attendanceToday
      },
      recentActivities: {
        recentUsers,
        recentAnnouncements
      },
      classDistribution
    }
  });
}));

// USER MANAGEMENT ROUTES

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Admin
router.get('/users', [
  query('role').optional().isIn(['admin', 'teacher', 'student']),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { role, isActive, page = 1, limit = 10, search } = req.query;

  // Build filter object
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('academic.class', 'name grade')
      .populate('academic.subjects', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Admin
router.post('/users', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').isIn(['admin', 'teacher', 'student']).withMessage('Invalid role'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const userData = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Generate default password if not provided
  if (!userData.password) {
    userData.password = `${userData.firstName.toLowerCase()}@123`;
  }

  // Create user
  const user = new User(userData);
  await user.save();

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user }
  });
}));

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Admin
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('academic.class', 'name grade')
    .populate('academic.subjects', 'name code')
    .populate('academic.subjectsTeaching', 'name code')
    .populate('academic.classesTeaching', 'name grade');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put('/users/:id', [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'teacher', 'student']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if email is being changed and is unique
  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  // Update user
  Object.assign(user, req.body);
  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  });
}));

// @route   DELETE /api/admin/users/:id
// @desc    Deactivate user
// @access  Admin
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot deactivate your own account'
    });
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// ACADEMIC MANAGEMENT ROUTES

// @route   GET /api/admin/classes
// @desc    Get all classes
// @access  Admin
router.get('/classes', asyncHandler(async (req, res) => {
  const classes = await Class.find()
    .populate('classTeacher', 'firstName lastName')
    .populate('subjects', 'name code')
    .sort({ grade: 1, name: 1 });

  res.json({
    success: true,
    data: { classes }
  });
}));

// @route   POST /api/admin/classes
// @desc    Create a new class
// @access  Admin
router.post('/classes', [
  body('name').trim().isLength({ min: 1 }).withMessage('Class name is required'),
  body('grade').isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const classData = new Class(req.body);
  await classData.save();

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: { class: classData }
  });
}));

// @route   GET /api/admin/subjects
// @desc    Get all subjects
// @access  Admin
router.get('/subjects', asyncHandler(async (req, res) => {
  const subjects = await Subject.find()
    .populate('teachers', 'firstName lastName')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { subjects }
  });
}));

// @route   POST /api/admin/subjects
// @desc    Create a new subject
// @access  Admin
router.post('/subjects', [
  body('name').trim().isLength({ min: 1 }).withMessage('Subject name is required'),
  body('code').trim().isLength({ min: 1 }).withMessage('Subject code is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const subject = new Subject(req.body);
  await subject.save();

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: { subject }
  });
}));

// RESULT MANAGEMENT ROUTES

// @route   GET /api/admin/results
// @desc    Get all results with filtering
// @access  Admin
router.get('/results', [
  query('class').optional().isMongoId(),
  query('examType').optional().isIn(['unit_test', 'mid_term', 'final_term', 'annual']),
  query('academicYear').optional(),
], asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.examType) filter.examType = req.query.examType;
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;

  const results = await Result.find(filter)
    .populate('student', 'firstName lastName studentId')
    .populate('class', 'name grade')
    .populate('subjects.subject', 'name code')
    .sort({ examDate: -1 });

  res.json({
    success: true,
    data: { results }
  });
}));

// @route   POST /api/admin/results/publish/:resultId
// @desc    Publish result
// @access  Admin
router.post('/results/publish/:resultId', asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.resultId)
    .populate('student');

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Result not found'
    });
  }

  result.isPublished = true;
  result.publishedDate = new Date();
  result.publishedBy = req.user._id;
  await result.save();

  // Send notification email to student
  try {
    await sendResultNotification(result.student, result);
  } catch (error) {
    console.error('Failed to send result notification:', error);
  }

  res.json({
    success: true,
    message: 'Result published successfully'
  });
}));

// ANNOUNCEMENT MANAGEMENT ROUTES

// @route   GET /api/admin/announcements
// @desc    Get all announcements
// @access  Admin
router.get('/announcements', asyncHandler(async (req, res) => {
  const announcements = await Announcement.find()
    .populate('author', 'firstName lastName')
    .populate('targetAudience.classes', 'name grade')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { announcements }
  });
}));

// @route   POST /api/admin/announcements
// @desc    Create a new announcement
// @access  Admin
router.post('/announcements', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('category').isIn(['general', 'academic', 'event', 'holiday', 'exam', 'admission', 'sports', 'emergency', 'achievement']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const announcementData = {
    ...req.body,
    author: req.user._id
  };

  const announcement = new Announcement(announcementData);
  await announcement.save();

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: { announcement }
  });
}));

// @route   PUT /api/admin/announcements/:id/publish
// @desc    Publish an announcement
// @access  Admin
router.put('/announcements/:id/publish', asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  
  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found'
    });
  }

  announcement.isPublished = true;
  announcement.publishDate = new Date();
  await announcement.save();

  res.json({
    success: true,
    message: 'Announcement published successfully'
  });
}));

// STATISTICS AND REPORTS

// @route   GET /api/admin/statistics/overview
// @desc    Get comprehensive statistics
// @access  Admin
router.get('/statistics/overview', asyncHandler(async (req, res) => {
  const [
    userStats,
    classStats,
    attendanceStats,
    resultStats
  ] = await Promise.all([
    User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    Class.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Attendance.aggregate([
      { 
        $match: { 
          date: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Result.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$examType', count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      userStats,
      classStats,
      attendanceStats,
      resultStats
    }
  });
}));

module.exports = router;