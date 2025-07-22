const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'sick', 'excused'],
    required: true
  },
  timeIn: Date,
  timeOut: Date,
  period: {
    type: Number,
    min: 1,
    max: 8
  },
  remarks: {
    type: String,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: function() {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'emergency', 'medical', 'maternity', 'paternity'],
    required: function() { 
      return this.status === 'absent' || this.status === 'excused'; 
    }
  },
  leaveApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveApplication'
  }
}, {
  timestamps: true
});

// Compound index for unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Other indexes for better performance
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ academicYear: 1 });

// Virtual for duration (if timeIn and timeOut are available)
attendanceSchema.virtual('duration').get(function() {
  if (this.timeIn && this.timeOut) {
    const diff = this.timeOut - this.timeIn;
    return Math.round(diff / (1000 * 60)); // duration in minutes
  }
  return null;
});

// Static method to get attendance summary for a user
attendanceSchema.statics.getAttendanceSummary = async function(userId, startDate, endDate) {
  const attendanceRecords = await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });

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

  return summary;
};

// Static method to get class attendance for a specific date
attendanceSchema.statics.getClassAttendance = function(classId, date) {
  return this.find({ 
    class: classId, 
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    }
  }).populate('user', 'firstName lastName studentId rollNumber');
};

module.exports = mongoose.model('Attendance', attendanceSchema);