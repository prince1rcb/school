const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'academic', 'event', 'holiday', 'exam', 'admission', 'sports', 'emergency', 'achievement'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    roles: [{
      type: String,
      enum: ['admin', 'teacher', 'student', 'parent'],
      default: ['student', 'teacher']
    }],
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    specific: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for read count
announcementSchema.virtual('readCount').get(function() {
  return this.readBy.length;
});

// Virtual for is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Index for better performance
announcementSchema.index({ category: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ publishDate: -1 });
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ isPinned: 1 });
announcementSchema.index({ 'targetAudience.roles': 1 });
announcementSchema.index({ 'targetAudience.classes': 1 });
announcementSchema.index({ tags: 1 });

// Static method to get announcements for a user
announcementSchema.statics.getForUser = function(userId, userRole, userClass) {
  const now = new Date();
  return this.find({
    isActive: true,
    isPublished: true,
    publishDate: { $lte: now },
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: now } }
    ],
    $or: [
      { 'targetAudience.roles': userRole },
      { 'targetAudience.classes': userClass },
      { 'targetAudience.specific': userId }
    ]
  }).sort({ isPinned: -1, publishDate: -1 })
    .populate('author', 'firstName lastName')
    .populate('targetAudience.classes', 'name grade');
};

module.exports = mongoose.model('Announcement', announcementSchema);