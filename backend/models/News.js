const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    excerpt: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['news', 'event', 'announcement', 'achievement'],
        default: 'news'
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    eventDate: {
        type: Date
    },
    eventLocation: {
        type: String,
        trim: true
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
newsSchema.index({ isPublished: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ featured: 1 });
newsSchema.index({ title: 'text', content: 'text' });

// Pre-save middleware
newsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Set publishedAt when first published
    if (this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    next();
});

// Virtual for URL slug
newsSchema.virtual('slug').get(function() {
    return this.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
});

// Method to increment views
newsSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

const News = mongoose.model('News', newsSchema);

module.exports = News;