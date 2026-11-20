const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
