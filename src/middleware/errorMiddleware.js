const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    
    // Support both Error objects and string errors
    const message = err.message || (typeof err === 'string' ? err : 'Internal Server Error');
    
    res.json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };
