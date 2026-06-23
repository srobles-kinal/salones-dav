const logger = require('../../../config/logger');
const { AppError } = require('../../../shared/errors/AppError');

module.exports = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    });
  }

  logger.error('UNEXPECTED ERROR', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    },
    meta: { timestamp: new Date().toISOString(), version: 'v1' },
  });
};
