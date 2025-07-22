const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Study material title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  chapter: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'audio', 'presentation', 'document', 'image', 'link', 'quiz'],
    required: true
  },
  category: {
    type: String,
    enum: ['lecture_notes', 'assignment', 'reference', 'practice_questions', 'solution', 'syllabus', 'textbook', 'other'],
    default: 'lecture_notes'
  },
  fileUrl: {
    type: String,
    required: function() {
      return this.type !== 'link';
    }
  },
  externalLink: {
    type: String,
    required: function() {
      return this.type === 'link';
    }
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishDate: Date,
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
  academicYear: {
    type: String,
    required: true,
    default: function() {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  }
}, {
  timestamps: true
});

// Virtual for likes count
studyMaterialSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comments count
studyMaterialSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Index for better performance
studyMaterialSchema.index({ subject: 1, class: 1 });
studyMaterialSchema.index({ type: 1 });
studyMaterialSchema.index({ category: 1 });
studyMaterialSchema.index({ isActive: 1, isPublished: 1 });
studyMaterialSchema.index({ uploadedBy: 1 });
studyMaterialSchema.index({ tags: 1 });
studyMaterialSchema.index({ createdAt: -1 });

// Static method to get materials for a class and subject
studyMaterialSchema.statics.getForClassAndSubject = function(classId, subjectId) {
  return this.find({
    class: classId,
    subject: subjectId,
    isActive: true,
    isPublished: true
  }).populate('uploadedBy', 'firstName lastName')
    .populate('subject', 'name code')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);