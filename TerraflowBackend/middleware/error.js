// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // MySQL/Database errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        error.message = 'Duplicate entry. This record already exists.';
        error.status = 400;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        error.message = 'Referenced record does not exist.';
        error.status = 400;
        break;
      case 'ER_ROW_IS_REFERENCED_2':
        error.message = 'Cannot delete record as it is referenced by other records.';
        error.status = 400;
        break;
      case 'ER_BAD_FIELD_ERROR':
        error.message = 'Invalid field in query.';
        error.status = 400;
        break;
      case 'ER_PARSE_ERROR':
        error.message = 'SQL syntax error.';
        error.status = 500;
        break;
      default:
        error.message = 'Database error occurred.';
        error.status = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.status = 400;
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};

module.exports = {
  errorHandler,
  notFound,
  requestLogger
};
