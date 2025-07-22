const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['academic', 'sports', 'cultural', 'competition', 'workshop', 'seminar', 'celebration', 'meeting', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetAudience: {
    roles: [{
      type: String,
      enum: ['admin', 'teacher', 'student', 'parent'],
      default: ['student']
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
  maxParticipants: {
    type: Number,
    min: 1
  },
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationDeadline: Date,
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'cancelled'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  }],
  images: [{
    url: String,
    caption: String
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  results: {
    winners: [{
      position: Number,
      participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      prize: String
    }],
    summary: String,
    reportUrl: String
  },
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Virtual for participant count
eventSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for is registration open
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return this.registrationRequired && 
         this.registrationDeadline && 
         this.registrationDeadline > now &&
         this.status === 'published';
});

// Virtual for average rating
eventSchema.virtual('averageRating').get(function() {
  if (this.feedback.length === 0) return 0;
  const totalRating = this.feedback.reduce((sum, fb) => sum + fb.rating, 0);
  return Math.round((totalRating / this.feedback.length) * 10) / 10;
});

// Index for better performance
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'targetAudience.roles': 1 });
eventSchema.index({ 'targetAudience.classes': 1 });
eventSchema.index({ tags: 1 });

// Pre-save middleware to validate dates
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.registrationDeadline && this.registrationDeadline > this.startDate) {
    return next(new Error('Registration deadline must be before event start date'));
  }
  
  next();
});

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function(limit = 10) {
  const now = new Date();
  return this.find({
    startDate: { $gte: now },
    status: 'published'
  }).sort({ startDate: 1 })
    .limit(limit)
    .populate('organizer', 'firstName lastName')
    .populate('targetAudience.classes', 'name grade');
};

// Static method to get events for a user
eventSchema.statics.getEventsForUser = function(userId, userRole, userClass) {
  return this.find({
    status: 'published',
    $or: [
      { 'targetAudience.roles': userRole },
      { 'targetAudience.classes': userClass },
      { 'targetAudience.specific': userId }
    ]
  }).sort({ startDate: 1 })
    .populate('organizer', 'firstName lastName')
    .populate('coordinators', 'firstName lastName');
};

module.exports = mongoose.model('Event', eventSchema);