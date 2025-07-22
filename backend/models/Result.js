const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'mid_term', 'final_term', 'annual', 'entrance', 'competitive'],
    required: true
  },
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examDate: {
    type: Date,
    required: true
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      required: true
    },
    remarks: {
      type: String,
      trim: true
    },
    isPass: {
      type: Boolean,
      default: function() {
        return this.marksObtained >= (this.maxMarks * 0.33); // 33% pass marks
      }
    }
  }],
  totalMarks: {
    type: Number,
    required: true
  },
  maxTotalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  overallGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    required: true
  },
  rank: {
    type: Number,
    min: 1
  },
  totalStudents: {
    type: Number,
    min: 1
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  remarks: {
    type: String,
    trim: true
  },
  teacherRemarks: {
    type: String,
    trim: true
  },
  principalRemarks: {
    type: String,
    trim: true
  },
  conductGrade: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
    default: 'Good'
  },
  attendance: {
    totalDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  extracurricular: {
    sports: { type: String, trim: true },
    arts: { type: String, trim: true },
    other: { type: String, trim: true }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedDate: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for pass/fail status
resultSchema.virtual('isPass').get(function() {
  return this.subjects.every(subject => subject.isPass);
});

// Pre-save middleware to calculate percentage and grade
resultSchema.pre('save', function(next) {
  // Calculate total marks
  this.totalMarks = this.subjects.reduce((total, subject) => total + subject.marksObtained, 0);
  this.maxTotalMarks = this.subjects.reduce((total, subject) => total + subject.maxMarks, 0);
  
  // Calculate percentage
  this.percentage = Math.round((this.totalMarks / this.maxTotalMarks) * 100 * 100) / 100;
  
  // Calculate overall grade
  if (this.percentage >= 90) this.overallGrade = 'A+';
  else if (this.percentage >= 80) this.overallGrade = 'A';
  else if (this.percentage >= 70) this.overallGrade = 'B+';
  else if (this.percentage >= 60) this.overallGrade = 'B';
  else if (this.percentage >= 50) this.overallGrade = 'C+';
  else if (this.percentage >= 40) this.overallGrade = 'C';
  else if (this.percentage >= 33) this.overallGrade = 'D';
  else this.overallGrade = 'F';
  
  // Calculate individual subject grades
  this.subjects.forEach(subject => {
    const subjectPercentage = (subject.marksObtained / subject.maxMarks) * 100;
    if (subjectPercentage >= 90) subject.grade = 'A+';
    else if (subjectPercentage >= 80) subject.grade = 'A';
    else if (subjectPercentage >= 70) subject.grade = 'B+';
    else if (subjectPercentage >= 60) subject.grade = 'B';
    else if (subjectPercentage >= 50) subject.grade = 'C+';
    else if (subjectPercentage >= 40) subject.grade = 'C';
    else if (subjectPercentage >= 33) subject.grade = 'D';
    else subject.grade = 'F';
    
    subject.isPass = subject.marksObtained >= (subject.maxMarks * 0.33);
  });
  
  next();
});

// Indexes for better performance
resultSchema.index({ student: 1, academicYear: 1 });
resultSchema.index({ class: 1, examType: 1 });
resultSchema.index({ examDate: 1 });
resultSchema.index({ isPublished: 1 });
resultSchema.index({ percentage: -1 }); // For ranking

// Static method to calculate ranks
resultSchema.statics.calculateRanks = async function(classId, examType, academicYear) {
  const results = await this.find({ 
    class: classId, 
    examType: examType, 
    academicYear: academicYear 
  }).sort({ percentage: -1 });
  
  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1;
    results[i].totalStudents = results.length;
    await results[i].save();
  }
  
  return results;
};

module.exports = mongoose.model('Result', resultSchema);