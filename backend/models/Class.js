const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    unique: true
  },
  grade: {
    type: Number,
    required: [true, 'Grade is required'],
    min: [1, 'Grade must be at least 1'],
    max: [12, 'Grade cannot exceed 12']
  },
  sections: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      default: 40
    },
    currentStrength: {
      type: Number,
      default: 0
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  academicYear: {
    type: String,
    required: true,
    default: function() {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fees: {
    tuitionFee: { type: Number, default: 0 },
    admissionFee: { type: Number, default: 0 },
    developmentFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    otherFees: { type: Number, default: 0 }
  },
  timetable: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    periods: [{
      periodNumber: Number,
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      startTime: String,
      endTime: String,
      room: String
    }]
  }]
}, {
  timestamps: true
});

// Virtual for total fees
classSchema.virtual('totalFees').get(function() {
  return this.fees.tuitionFee + this.fees.admissionFee + 
         this.fees.developmentFee + this.fees.examFee + this.fees.otherFees;
});

// Virtual for total students across all sections
classSchema.virtual('totalStudents').get(function() {
  return this.sections.reduce((total, section) => total + section.currentStrength, 0);
});

// Index for better performance
classSchema.index({ grade: 1 });
classSchema.index({ academicYear: 1 });
classSchema.index({ isActive: 1 });

module.exports = mongoose.model('Class', classSchema);