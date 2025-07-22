const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['academic', 'sports', 'cultural', 'science', 'recognition', 'other'],
        required: true
    },
    level: {
        type: String,
        enum: ['school', 'district', 'state', 'national', 'international'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    participants: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        class: String,
        position: String
    }],
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    award: {
        type: String,
        trim: true
    },
    organization: {
        type: String,
        trim: true
    },
    certificate: {
        type: String // URL to certificate image/PDF
    },
    featured: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
achievementSchema.index({ date: -1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ level: 1 });
achievementSchema.index({ featured: 1 });
achievementSchema.index({ isPublished: 1 });

// Pre-save middleware
achievementSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;