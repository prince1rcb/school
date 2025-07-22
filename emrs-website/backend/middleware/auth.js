// Simple auth middleware for testing
const authMiddleware = (req, res, next) => {
    // For testing, we'll just pass through
    req.user = { id: 1, name: 'Test User', role: 'admin' };
    next();
};

module.exports = authMiddleware;
