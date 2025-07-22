const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const achievementRoutes = require('./routes/achievements');
const announcementRoutes = require('./routes/announcements');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/teacher', authMiddleware, teacherRoutes);
app.use('/api/student', authMiddleware, studentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'EMRS Dornala API Server is running'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'EMRS Dornala API Server',
        version: '1.0.0',
        health: '/api/health'
    });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: 'The requested endpoint does not exist'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
