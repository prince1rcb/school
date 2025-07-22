const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/common/classes
// @desc    Get all active classes (public)
// @access  Public
router.get('/classes', asyncHandler(async (req, res) => {
  const classes = await Class.find({ isActive: true })
    .select('name grade sections.name sections.capacity')
    .sort({ grade: 1, name: 1 });

  res.json({
    success: true,
    data: { classes }
  });
}));

// @route   GET /api/common/subjects
// @desc    Get all active subjects (public)
// @access  Public
router.get('/subjects', asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ isActive: true })
    .select('name code category grades')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { subjects }
  });
}));

// @route   GET /api/common/announcements/public
// @desc    Get public announcements
// @access  Public
router.get('/announcements/public', [
  query('limit').optional().isInt({ min: 1, max: 20 })
], asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const announcements = await Announcement.find({
    isActive: true,
    isPublished: true,
    'targetAudience.roles': { $in: ['student', 'teacher'] },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: new Date() } }
    ]
  })
    .populate('author', 'firstName lastName')
    .sort({ isPinned: -1, publishDate: -1 })
    .limit(parseInt(limit))
    .select('title content category priority publishDate isPinned');

  res.json({
    success: true,
    data: { announcements }
  });
}));

// @route   GET /api/common/events/public
// @desc    Get public upcoming events
// @access  Public
router.get('/events/public', [
  query('limit').optional().isInt({ min: 1, max: 20 })
], asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const events = await Event.find({
    status: 'published',
    isPublic: true,
    startDate: { $gte: new Date() }
  })
    .populate('organizer', 'firstName lastName')
    .sort({ startDate: 1 })
    .limit(parseInt(limit))
    .select('title description category startDate endDate venue organizer');

  res.json({
    success: true,
    data: { events }
  });
}));

// @route   GET /api/common/school-info
// @desc    Get basic school information
// @access  Public
router.get('/school-info', asyncHandler(async (req, res) => {
  const schoolInfo = {
    name: process.env.SCHOOL_NAME || 'EMRS Dornala',
    address: process.env.SCHOOL_ADDRESS || 'Dornala, Andhra Pradesh, India',
    phone: process.env.SCHOOL_PHONE || '+91-9876543210',
    email: process.env.SCHOOL_EMAIL || 'info@emrsdornala.edu.in',
    website: process.env.SCHOOL_WEBSITE || 'https://emrsdornala.edu.in',
    establishedYear: 2010,
    affiliation: 'CBSE',
    medium: 'English',
    grades: '6th to 12th',
    type: 'Co-Educational Residential School'
  };

  // Get basic statistics
  const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Class.countDocuments({ isActive: true })
  ]);

  res.json({
    success: true,
    data: {
      schoolInfo,
      statistics: {
        totalStudents,
        totalTeachers,
        totalClasses
      }
    }
  });
}));

// @route   GET /api/common/search
// @desc    Global search functionality
// @access  Private
router.get('/search', authenticate, [
  query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('type').optional().isIn(['users', 'announcements', 'events', 'materials'])
], asyncHandler(async (req, res) => {
  const { q: searchQuery, type } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;

  const results = {};

  // Search users (admin and teachers can search all, students can search classmates)
  if (!type || type === 'users') {
    let userFilter = {
      isActive: true,
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { studentId: { $regex: searchQuery, $options: 'i' } },
        { employeeId: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // Students can only search within their class
    if (userRole === 'student') {
      const currentUser = await User.findById(userId);
      userFilter['academic.class'] = currentUser.academic.class;
      userFilter.role = 'student';
    }

    results.users = await User.find(userFilter)
      .select('firstName lastName email role studentId employeeId academic.class')
      .populate('academic.class', 'name grade')
      .limit(10);
  }

  // Search announcements
  if (!type || type === 'announcements') {
    const user = await User.findById(userId);
    
    results.announcements = await Announcement.find({
      isActive: true,
      isPublished: true,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ],
      $or: [
        { 'targetAudience.roles': userRole },
        { 'targetAudience.classes': user.academic.class },
        { 'targetAudience.specific': userId }
      ]
    })
      .populate('author', 'firstName lastName')
      .sort({ publishDate: -1 })
      .limit(10);
  }

  // Search events
  if (!type || type === 'events') {
    const user = await User.findById(userId);
    
    results.events = await Event.find({
      status: 'published',
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ],
      $or: [
        { 'targetAudience.roles': userRole },
        { 'targetAudience.classes': user.academic.class },
        { 'targetAudience.specific': userId }
      ]
    })
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 })
      .limit(10);
  }

  // Search study materials (students and teachers)
  if ((!type || type === 'materials') && (userRole === 'student' || userRole === 'teacher')) {
    const user = await User.findById(userId);
    
    let materialsFilter = {
      isActive: true,
      isPublished: true,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // Students can only see materials for their class
    if (userRole === 'student') {
      materialsFilter.class = user.academic.class;
    }
    // Teachers can see materials for their teaching classes
    else if (userRole === 'teacher') {
      materialsFilter.class = { $in: user.academic.classesTeaching };
    }

    const StudyMaterial = require('../models/StudyMaterial');
    results.studyMaterials = await StudyMaterial.find(materialsFilter)
      .populate('subject', 'name code')
      .populate('class', 'name grade')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);
  }

  res.json({
    success: true,
    data: results
  });
}));

// @route   GET /api/common/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;

  const notifications = [];

  // Get unread announcements
  const user = await User.findById(userId);
  const unreadAnnouncements = await Announcement.find({
    isActive: true,
    isPublished: true,
    readBy: { $not: { $elemMatch: { user: userId } } },
    $or: [
      { 'targetAudience.roles': userRole },
      { 'targetAudience.classes': user.academic.class },
      { 'targetAudience.specific': userId }
    ]
  })
    .populate('author', 'firstName lastName')
    .sort({ publishDate: -1 })
    .limit(10);

  unreadAnnouncements.forEach(announcement => {
    notifications.push({
      type: 'announcement',
      title: announcement.title,
      message: announcement.content.substring(0, 100) + '...',
      date: announcement.publishDate,
      priority: announcement.priority,
      id: announcement._id,
      author: announcement.author
    });
  });

  // Get upcoming events user hasn't seen
  const upcomingEvents = await Event.getEventsForUser(userId, userRole, user.academic.class)
    .limit(5);

  upcomingEvents.forEach(event => {
    if (new Date(event.startDate) > new Date()) {
      notifications.push({
        type: 'event',
        title: event.title,
        message: `Upcoming event on ${event.startDate.toDateString()}`,
        date: event.createdAt,
        priority: 'medium',
        id: event._id,
        organizer: event.organizer
      });
    }
  });

  // Sort notifications by date (newest first)
  notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply pagination
  const skip = (page - 1) * limit;
  const paginatedNotifications = notifications.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: {
      notifications: paginatedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length,
        pages: Math.ceil(notifications.length / limit)
      },
      unreadCount: notifications.length
    }
  });
}));

// @route   GET /api/common/calendar
// @desc    Get calendar events for user
// @access  Private
router.get('/calendar', authenticate, [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 })
], asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { month, year } = req.query;

  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0);

  // Get events for the month
  const user = await User.findById(userId);
  const events = await Event.find({
    status: 'published',
    startDate: { $gte: startDate, $lte: endDate },
    $or: [
      { 'targetAudience.roles': userRole },
      { 'targetAudience.classes': user.academic.class },
      { 'targetAudience.specific': userId }
    ]
  })
    .populate('organizer', 'firstName lastName')
    .sort({ startDate: 1 });

  // Get exam dates from results (for students)
  let examDates = [];
  if (userRole === 'student') {
    const results = await Result.find({
      student: userId,
      examDate: { $gte: startDate, $lte: endDate }
    }).select('examName examDate examType');
    
    examDates = results.map(result => ({
      type: 'exam',
      title: result.examName,
      date: result.examDate,
      examType: result.examType
    }));
  }

  // Combine events and exams
  const calendarEvents = [
    ...events.map(event => ({
      type: 'event',
      id: event._id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      category: event.category,
      organizer: event.organizer
    })),
    ...examDates
  ];

  res.json({
    success: true,
    data: {
      month: targetMonth + 1,
      year: targetYear,
      events: calendarEvents
    }
  });
}));

// @route   GET /api/common/stats
// @desc    Get general statistics (role-based)
// @access  Private
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;

  let stats = {};

  if (userRole === 'admin') {
    // Admin gets comprehensive stats
    stats = {
      totalUsers: await User.countDocuments({ isActive: true }),
      totalStudents: await User.countDocuments({ role: 'student', isActive: true }),
      totalTeachers: await User.countDocuments({ role: 'teacher', isActive: true }),
      totalClasses: await Class.countDocuments({ isActive: true }),
      totalSubjects: await Subject.countDocuments({ isActive: true }),
      activeAnnouncements: await Announcement.countDocuments({ isActive: true, isPublished: true }),
      upcomingEvents: await Event.countDocuments({ status: 'published', startDate: { $gte: new Date() } })
    };
  } else if (userRole === 'teacher') {
    // Teacher gets teaching-related stats
    const teacher = await User.findById(userId);
    stats = {
      myClasses: teacher.academic.classesTeaching?.length || 0,
      mySubjects: teacher.academic.subjectsTeaching?.length || 0,
      myStudents: await User.countDocuments({ 
        role: 'student', 
        isActive: true, 
        'academic.class': { $in: teacher.academic.classesTeaching } 
      }),
      myMaterials: await StudyMaterial.countDocuments({ uploadedBy: userId, isActive: true }),
      myAnnouncements: await Announcement.countDocuments({ author: userId, isActive: true })
    };
  } else if (userRole === 'student') {
    // Student gets personal stats
    const student = await User.findById(userId);
    stats = {
      myClass: student.academic.class ? 1 : 0,
      mySubjects: student.academic.subjects?.length || 0,
      availableMaterials: await StudyMaterial.countDocuments({ 
        class: student.academic.class, 
        isActive: true, 
        isPublished: true 
      }),
      myResults: await Result.countDocuments({ student: userId, isPublished: true }),
      unreadAnnouncements: await Announcement.countDocuments({
        isActive: true,
        isPublished: true,
        readBy: { $not: { $elemMatch: { user: userId } } },
        $or: [
          { 'targetAudience.roles': 'student' },
          { 'targetAudience.classes': student.academic.class },
          { 'targetAudience.specific': userId }
        ]
      })
    };
  }

  res.json({
    success: true,
    data: { stats }
  });
}));

module.exports = router;