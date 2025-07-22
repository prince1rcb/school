const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const StudyMaterial = require('../models/StudyMaterial');
const { authenticate, isTeacherOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication and teacher/admin authorization to all routes
router.use(authenticate);
router.use(isTeacherOrAdmin);

// @route   GET /api/teacher/dashboard
// @desc    Get teacher dashboard
// @access  Teacher/Admin
router.get('/dashboard', asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  // Get teacher's classes and subjects
  const teacher = await User.findById(teacherId)
    .populate('academic.classesTeaching', 'name grade')
    .populate('academic.subjectsTeaching', 'name code');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found'
    });
  }

  const classIds = teacher.academic.classesTeaching.map(cls => cls._id);
  const subjectIds = teacher.academic.subjectsTeaching.map(sub => sub._id);

  // Get statistics
  const [
    totalStudents,
    totalClasses,
    totalSubjects,
    todayAttendance,
    recentResults,
    upcomingEvents,
    myMaterials
  ] = await Promise.all([
    User.countDocuments({ 
      role: 'student', 
      isActive: true, 
      'academic.class': { $in: classIds } 
    }),
    teacher.academic.classesTeaching.length,
    teacher.academic.subjectsTeaching.length,
    Attendance.countDocuments({ 
      markedBy: teacherId,
      date: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      } 
    }),
    Result.countDocuments({ 
      class: { $in: classIds },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    }),
    Event.countDocuments({ 
      organizer: teacherId,
      startDate: { $gte: new Date() } 
    }),
    StudyMaterial.countDocuments({ 
      uploadedBy: teacherId,
      isActive: true 
    })
  ]);

  // Get recent activities
  const recentAttendance = await Attendance.find({ 
    markedBy: teacherId 
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'firstName lastName studentId')
    .populate('class', 'name grade');

  const recentAnnouncements = await Announcement.find({ 
    author: teacherId 
  })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      teacher: {
        name: teacher.fullName,
        employeeId: teacher.employeeId,
        email: teacher.email,
        classesTeaching: teacher.academic.classesTeaching,
        subjectsTeaching: teacher.academic.subjectsTeaching
      },
      statistics: {
        totalStudents,
        totalClasses,
        totalSubjects,
        todayAttendance,
        recentResults,
        upcomingEvents,
        myMaterials
      },
      recentActivities: {
        recentAttendance,
        recentAnnouncements
      }
    }
  });
}));

// STUDENT PERFORMANCE ROUTES

// @route   GET /api/teacher/students
// @desc    Get students in teacher's classes
// @access  Teacher/Admin
router.get('/students', [
  query('classId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { classId, page = 1, limit = 20 } = req.query;

  // Get teacher's classes
  const teacher = await User.findById(teacherId);
  let classFilter = { $in: teacher.academic.classesTeaching };
  
  if (classId) {
    // Verify teacher teaches this class
    if (!teacher.academic.classesTeaching.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view students from this class'
      });
    }
    classFilter = classId;
  }

  const filter = {
    role: 'student',
    isActive: true,
    'academic.class': classFilter
  };

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('academic.class', 'name grade')
      .populate('academic.subjects', 'name code')
      .sort({ 'academic.rollNumber': 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/teacher/students/:id/performance
// @desc    Get student performance details
// @access  Teacher/Admin
router.get('/students/:id/performance', asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  const teacherId = req.user._id;

  // Get student
  const student = await User.findById(studentId)
    .populate('academic.class', 'name grade')
    .populate('academic.subjects', 'name code');

  if (!student || student.role !== 'student') {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Verify teacher teaches this student's class
  const teacher = await User.findById(teacherId);
  if (!teacher.academic.classesTeaching.includes(student.academic.class._id)) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to view this student\'s performance'
    });
  }

  // Get student's results
  const results = await Result.find({ 
    student: studentId,
    class: student.academic.class._id
  })
    .populate('subjects.subject', 'name code')
    .sort({ examDate: -1 });

  // Get attendance summary
  const attendanceSummary = await Attendance.getAttendanceSummary(
    studentId,
    new Date(new Date().getFullYear(), 3, 1), // Academic year start (April)
    new Date()
  );

  res.json({
    success: true,
    data: {
      student: {
        _id: student._id,
        name: student.fullName,
        studentId: student.studentId,
        class: student.academic.class,
        subjects: student.academic.subjects
      },
      results,
      attendanceSummary
    }
  });
}));

// ATTENDANCE MANAGEMENT

// @route   GET /api/teacher/attendance
// @desc    Get attendance records
// @access  Teacher/Admin
router.get('/attendance', [
  query('classId').optional().isMongoId(),
  query('date').optional().isDate(),
  query('page').optional().isInt({ min: 1 }),
], asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { classId, date, page = 1, limit = 50 } = req.query;

  // Build filter
  const filter = { markedBy: teacherId };
  
  if (classId) {
    filter.class = classId;
  }
  
  if (date) {
    const targetDate = new Date(date);
    filter.date = {
      $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      $lt: new Date(targetDate.setHours(23, 59, 59, 999))
    };
  }

  const skip = (page - 1) * limit;

  const [attendanceRecords, total] = await Promise.all([
    Attendance.find(filter)
      .populate('user', 'firstName lastName studentId')
      .populate('class', 'name grade')
      .populate('subject', 'name code')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Attendance.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      attendance: attendanceRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   POST /api/teacher/attendance
// @desc    Mark attendance for students
// @access  Teacher/Admin
router.post('/attendance', [
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('attendanceData').isArray({ min: 1 }).withMessage('Attendance data is required'),
  body('attendanceData.*.studentId').isMongoId().withMessage('Valid student ID is required'),
  body('attendanceData.*.status').isIn(['present', 'absent', 'late', 'sick', 'excused']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { classId, date, attendanceData, subjectId, period } = req.body;
  const teacherId = req.user._id;

  // Verify teacher teaches this class
  const teacher = await User.findById(teacherId);
  if (!teacher.academic.classesTeaching.includes(classId)) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to mark attendance for this class'
    });
  }

  const attendanceDate = new Date(date);
  const createdAttendance = [];

  for (const data of attendanceData) {
    try {
      // Check if attendance already exists for this student on this date
      let attendance = await Attendance.findOne({
        user: data.studentId,
        class: classId,
        date: {
          $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
          $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
        }
      });

      if (attendance) {
        // Update existing attendance
        attendance.status = data.status;
        attendance.timeIn = data.timeIn;
        attendance.timeOut = data.timeOut;
        attendance.period = period;
        attendance.remarks = data.remarks;
        attendance.markedBy = teacherId;
        if (subjectId) attendance.subject = subjectId;
        
        await attendance.save();
      } else {
        // Create new attendance record
        attendance = new Attendance({
          user: data.studentId,
          class: classId,
          subject: subjectId,
          date: attendanceDate,
          status: data.status,
          timeIn: data.timeIn,
          timeOut: data.timeOut,
          period: period,
          remarks: data.remarks,
          markedBy: teacherId
        });
        
        await attendance.save();
      }

      createdAttendance.push(attendance);
    } catch (error) {
      console.error(`Failed to mark attendance for student ${data.studentId}:`, error);
    }
  }

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    data: { attendance: createdAttendance }
  });
}));

// RESOURCE UPLOAD

// @route   GET /api/teacher/study-materials
// @desc    Get teacher's study materials
// @access  Teacher/Admin
router.get('/study-materials', [
  query('classId').optional().isMongoId(),
  query('subjectId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
], asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { classId, subjectId, page = 1, limit = 20 } = req.query;

  const filter = { uploadedBy: teacherId };
  if (classId) filter.class = classId;
  if (subjectId) filter.subject = subjectId;

  const skip = (page - 1) * limit;

  const [materials, total] = await Promise.all([
    StudyMaterial.find(filter)
      .populate('class', 'name grade')
      .populate('subject', 'name code')
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

// @route   POST /api/teacher/study-materials
// @desc    Upload study material
// @access  Teacher/Admin
router.post('/study-materials', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('type').isIn(['pdf', 'video', 'audio', 'presentation', 'document', 'image', 'link']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const teacherId = req.user._id;
  const materialData = {
    ...req.body,
    class: req.body.classId,
    subject: req.body.subjectId,
    uploadedBy: teacherId
  };

  // Verify teacher teaches this class and subject
  const teacher = await User.findById(teacherId);
  if (!teacher.academic.classesTeaching.includes(req.body.classId) || 
      !teacher.academic.subjectsTeaching.includes(req.body.subjectId)) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to upload material for this class/subject'
    });
  }

  const material = new StudyMaterial(materialData);
  await material.save();

  await material.populate('class', 'name grade');
  await material.populate('subject', 'name code');

  res.status(201).json({
    success: true,
    message: 'Study material uploaded successfully',
    data: { material }
  });
}));

// @route   PUT /api/teacher/study-materials/:id
// @desc    Update study material
// @access  Teacher/Admin
router.put('/study-materials/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
], asyncHandler(async (req, res) => {
  const materialId = req.params.id;
  const teacherId = req.user._id;

  const material = await StudyMaterial.findById(materialId);
  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Study material not found'
    });
  }

  // Verify ownership (or admin)
  if (material.uploadedBy.toString() !== teacherId.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own materials'
    });
  }

  Object.assign(material, req.body);
  await material.save();

  res.json({
    success: true,
    message: 'Study material updated successfully',
    data: { material }
  });
}));

// @route   DELETE /api/teacher/study-materials/:id
// @desc    Delete study material
// @access  Teacher/Admin
router.delete('/study-materials/:id', asyncHandler(async (req, res) => {
  const materialId = req.params.id;
  const teacherId = req.user._id;

  const material = await StudyMaterial.findById(materialId);
  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Study material not found'
    });
  }

  // Verify ownership (or admin)
  if (material.uploadedBy.toString() !== teacherId.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own materials'
    });
  }

  material.isActive = false;
  await material.save();

  res.json({
    success: true,
    message: 'Study material deleted successfully'
  });
}));

// INTERNAL NOTICES

// @route   GET /api/teacher/announcements
// @desc    Get teacher's announcements
// @access  Teacher/Admin
router.get('/announcements', asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const announcements = await Announcement.find({ author: teacherId })
    .populate('targetAudience.classes', 'name grade')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { announcements }
  });
}));

// @route   POST /api/teacher/announcements
// @desc    Create announcement
// @access  Teacher/Admin
router.post('/announcements', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
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

module.exports = router;