const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['core', 'elective', 'language', 'science', 'mathematics', 'social_science', 'arts', 'sports', 'other'],
    default: 'core'
  },
  grades: [{
    type: Number,
    min: 1,
    max: 12
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  credits: {
    type: Number,
    default: 1
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  passMarks: {
    type: Number,
    default: 33
  },
  syllabus: {
    type: String,
    trim: true
  },
  books: [{
    title: String,
    author: String,
    publisher: String,
    isbn: String
  }],
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for better performance
subjectSchema.index({ code: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ grades: 1 });
subjectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Subject', subjectSchema);