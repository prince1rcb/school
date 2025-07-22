const express = require('express');
const { query } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const StudyMaterial = require('../models/StudyMaterial');
const Event = require('../models/Event');
const { authenticate, isStudent, isOwnerOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/student/dashboard
// @desc    Get student dashboard
// @access  Student
router.get('/dashboard', isStudent, asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Get student details with populated fields
  const student = await User.findById(studentId)
    .populate('academic.class', 'name grade')
    .populate('academic.subjects', 'name code');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Get attendance summary for current academic year
  const academicYearStart = new Date(new Date().getFullYear(), 3, 1); // April 1st
  const attendanceSummary = await Attendance.getAttendanceSummary(
    studentId,
    academicYearStart,
    new Date()
  );

  // Get recent results
  const recentResults = await Result.find({ 
    student: studentId,
    isPublished: true
  })
    .populate('subjects.subject', 'name code')
    .sort({ examDate: -1 })
    .limit(5);

  // Get announcements for student
  const announcements = await Announcement.getForUser(
    studentId,
    'student',
    student.academic.class?._id
  ).limit(5);

  // Get upcoming events
  const upcomingEvents = await Event.getEventsForUser(
    studentId,
    'student',
    student.academic.class?._id
  ).limit(5);

  // Get study materials count
  const studyMaterialsCount = await StudyMaterial.countDocuments({
    class: student.academic.class?._id,
    isActive: true,
    isPublished: true
  });

  // Calculate overall performance metrics
  const overallPerformance = recentResults.length > 0 ? {
    averagePercentage: recentResults.reduce((sum, result) => sum + result.percentage, 0) / recentResults.length,
    lastExamPercentage: recentResults[0]?.percentage || 0,
    totalExams: recentResults.length
  } : null;

  res.json({
    success: true,
    data: {
      student: {
        name: student.fullName,
        studentId: student.studentId,
        email: student.email,
        class: student.academic.class,
        subjects: student.academic.subjects,
        profilePicture: student.profilePicture
      },
      attendanceSummary,
      recentResults,
      announcements,
      upcomingEvents,
      statistics: {
        studyMaterialsCount,
        attendancePercentage: attendanceSummary.percentage,
        totalSubjects: student.academic.subjects?.length || 0
      },
      overallPerformance
    }
  });
}));

// RESULTS ROUTES

// @route   GET /api/student/results
// @desc    Get student's exam results
// @access  Student
router.get('/results', isStudent, [
  query('examType').optional().isIn(['unit_test', 'mid_term', 'final_term', 'annual']),
  query('academicYear').optional(),
], asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { examType, academicYear } = req.query;

  const filter = { 
    student: studentId,
    isPublished: true
  };

  if (examType) filter.examType = examType;
  if (academicYear) filter.academicYear = academicYear;

  const results = await Result.find(filter)
    .populate('class', 'name grade')
    .populate('subjects.subject', 'name code')
    .sort({ examDate: -1 });

  // Calculate performance trends
  const performanceTrend = results.map(result => ({
    examName: result.examName,
    examDate: result.examDate,
    percentage: result.percentage,
    grade: result.overallGrade,
    rank: result.rank,
    totalStudents: result.totalStudents
  }));

  res.json({
    success: true,
    data: {
      results,
      performanceTrend,
      totalResults: results.length
    }
  });
}));

// @route   GET /api/student/results/:id
// @desc    Get detailed result by ID
// @access  Student
router.get('/results/:id', isStudent, asyncHandler(async (req, res) => {
  const resultId = req.params.id;
  const studentId = req.user._id;

  const result = await Result.findOne({
    _id: resultId,
    student: studentId,
    isPublished: true
  })
    .populate('class', 'name grade')
    .populate('subjects.subject', 'name code')
    .populate('publishedBy', 'firstName lastName');

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Result not found or not accessible'
    });
  }

  res.json({
    success: true,
    data: { result }
  });
}));

// ATTENDANCE ROUTES

// @route   GET /api/student/attendance
// @desc    Get student's attendance records
// @access  Student
router.get('/attendance', isStudent, [
  query('startDate').optional().isDate(),
  query('endDate').optional().isDate(),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
], asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { startDate, endDate, month, year } = req.query;

  let dateFilter = {};

  if (startDate && endDate) {
    dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    dateFilter = {
      $gte: start,
      $lte: end
    };
  } else {
    // Default to current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    dateFilter = {
      $gte: start,
      $lte: end
    };
  }

  const attendanceRecords = await Attendance.find({
    user: studentId,
    date: dateFilter
  })
    .populate('class', 'name grade')
    .populate('subject', 'name code')
    .populate('markedBy', 'firstName lastName')
    .sort({ date: -1 });

  // Calculate summary
  const summary = {
    totalDays: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === 'present').length,
    absent: attendanceRecords.filter(a => a.status === 'absent').length,
    late: attendanceRecords.filter(a => a.status === 'late').length,
    sick: attendanceRecords.filter(a => a.status === 'sick').length,
    excused: attendanceRecords.filter(a => a.status === 'excused').length
  };

  summary.percentage = summary.totalDays > 0 ? 
    Math.round((summary.present / summary.totalDays) * 100 * 100) / 100 : 0;

  res.json({
    success: true,
    data: {
      attendanceRecords,
      summary
    }
  });
}));

// STUDY MATERIALS ROUTES

// @route   GET /api/student/study-materials
// @desc    Get study materials for student's class
// @access  Student
router.get('/study-materials', isStudent, [
  query('subjectId').optional().isMongoId(),
  query('type').optional().isIn(['pdf', 'video', 'audio', 'presentation', 'document', 'image', 'link']),
  query('category').optional().isIn(['lecture_notes', 'assignment', 'reference', 'practice_questions', 'solution', 'syllabus', 'textbook', 'other']),
  query('page').optional().isInt({ min: 1 }),
], asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { subjectId, type, category, page = 1, limit = 20 } = req.query;

  // Get student's class
  const student = await User.findById(studentId).populate('academic.class');
  if (!student.academic.class) {
    return res.status(400).json({
      success: false,
      message: 'Student is not assigned to any class'
    });
  }

  const filter = {
    class: student.academic.class._id,
    isActive: true,
    isPublished: true
  };

  if (subjectId) filter.subject = subjectId;
  if (type) filter.type = type;
  if (category) filter.category = category;

  const skip = (page - 1) * limit;

  const [materials, total] = await Promise.all([
    StudyMaterial.find(filter)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    StudyMaterial.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/student/study-materials/:id
// @desc    Get study material details and track view
// @access  Student
router.get('/study-materials/:id', isStudent, asyncHandler(async (req, res) => {
  const materialId = req.params.id;
  const studentId = req.user._id;

  const material = await StudyMaterial.findById(materialId)
    .populate('subject', 'name code')
    .populate('class', 'name grade')
    .populate('uploadedBy', 'firstName lastName');

  if (!material || !material.isActive || !material.isPublished) {
    return res.status(404).json({
      success: false,
      message: 'Study material not found'
    });
  }

  // Verify student has access to this material
  const student = await User.findById(studentId);
  if (student.academic.class.toString() !== material.class._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this study material'
    });
  }

  // Increment view count
  material.viewCount += 1;
  await material.save();

  res.json({
    success: true,
    data: { material }
  });
}));

// @route   POST /api/student/study-materials/:id/download
// @desc    Track download of study material
// @access  Student
router.post('/study-materials/:id/download', isStudent, asyncHandler(async (req, res) => {
  const materialId = req.params.id;

  const material = await StudyMaterial.findById(materialId);
  if (material) {
    material.downloadCount += 1;
    await material.save();
  }

  res.json({
    success: true,
    message: 'Download tracked successfully'
  });
}));

// CLASS SCHEDULE ROUTES

// @route   GET /api/student/schedule
// @desc    Get student's class schedule/timetable
// @access  Student
router.get('/schedule', isStudent, [
  query('day').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
], asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { day } = req.query;

  // Get student's class
  const student = await User.findById(studentId).populate('academic.class');
  if (!student.academic.class) {
    return res.status(400).json({
      success: false,
      message: 'Student is not assigned to any class'
    });
  }

  // Get class timetable
  const classData = await Class.findById(student.academic.class._id)
    .populate('timetable.periods.subject', 'name code')
    .populate('timetable.periods.teacher', 'firstName lastName');

  let timetable = classData.timetable;

  // Filter by day if specified
  if (day) {
    timetable = timetable.filter(tt => tt.day === day);
  }

  res.json({
    success: true,
    data: {
      class: student.academic.class,
      timetable
    }
  });
}));

// ANNOUNCEMENTS ROUTES

// @route   GET /api/student/announcements
// @desc    Get announcements for student
// @access  Student
router.get('/announcements', isStudent, [
  query('category').optional().isIn(['general', 'academic', 'event', 'holiday', 'exam', 'admission', 'sports', 'emergency', 'achievement']),
  query('page').optional().isInt({ min: 1 }),
], asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { category, page = 1, limit = 10 } = req.query;

  const student = await User.findById(studentId);
  
  let announcements = await Announcement.getForUser(
    studentId,
    'student',
    student.academic.class
  );

  // Filter by category if specified
  if (category) {
    announcements = announcements.filter(ann => ann.category === category);
  }

  // Pagination
  const skip = (page - 1) * limit;
  const paginatedAnnouncements = announcements.slice(skip, skip + parseInt(limit));
  const total = announcements.length;

  res.json({
    success: true,
    data: {
      announcements: paginatedAnnouncements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   POST /api/student/announcements/:id/read
// @desc    Mark announcement as read
// @access  Student
router.post('/announcements/:id/read', isStudent, asyncHandler(async (req, res) => {
  const announcementId = req.params.id;
  const studentId = req.user._id;

  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found'
    });
  }

  // Check if already read
  const alreadyRead = announcement.readBy.some(
    read => read.user.toString() === studentId.toString()
  );

  if (!alreadyRead) {
    announcement.readBy.push({
      user: studentId,
      readAt: new Date()
    });
    await announcement.save();
  }

  res.json({
    success: true,
    message: 'Announcement marked as read'
  });
}));

// EVENTS ROUTES

// @route   GET /api/student/events
// @desc    Get events for student
// @access  Student
router.get('/events', isStudent, [
  query('category').optional().isIn(['academic', 'sports', 'cultural', 'competition', 'workshop', 'seminar', 'celebration', 'meeting', 'other']),
  query('status').optional().isIn(['published', 'ongoing', 'completed']),
], asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { category, status } = req.query;

  const student = await User.findById(studentId);
  
  let events = await Event.getEventsForUser(
    studentId,
    'student',
    student.academic.class
  );

  // Apply filters
  if (category) {
    events = events.filter(event => event.category === category);
  }
  
  if (status) {
    events = events.filter(event => event.status === status);
  }

  res.json({
    success: true,
    data: { events }
  });
}));

// HOSTEL AND CAMPUS INFO ROUTES

// @route   GET /api/student/hostel-info
// @desc    Get student's hostel information
// @access  Student
router.get('/hostel-info', isStudent, asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const student = await User.findById(studentId).select('hostel fees');

  res.json({
    success: true,
    data: {
      hostelInfo: student.hostel,
      feesInfo: student.fees
    }
  });
}));

// PROFILE ROUTES

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Student
router.get('/profile', isStudent, asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const student = await User.findById(studentId)
    .select('-password')
    .populate('academic.class', 'name grade')
    .populate('academic.subjects', 'name code');

  res.json({
    success: true,
    data: { student }
  });
}));

// @route   PUT /api/student/profile
// @desc    Update student profile (limited fields)
// @access  Student
router.put('/profile', isStudent, asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  
  // Only allow certain fields to be updated by student
  const allowedUpdates = [
    'phone',
    'alternativePhone',
    'address',
    'guardian.father.phone',
    'guardian.father.email',
    'guardian.mother.phone',
    'guardian.mother.email',
    'guardian.localGuardian',
    'medical.allergies',
    'medical.medications',
    'medical.emergencyContact',
    'preferences'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const student = await User.findByIdAndUpdate(
    studentId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { student }
  });
}));

module.exports = router;