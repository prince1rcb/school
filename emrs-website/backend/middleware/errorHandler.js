const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;
