const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid resource ID'
        });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // File upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File size too large'
        });
    }

    // Default server error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = errorHandler;