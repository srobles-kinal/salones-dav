class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) { super('VALIDATION_ERROR', message, 400, details); }
}

class AuthError extends AppError {
  constructor(message = 'No autenticado') { super('UNAUTHORIZED', message, 401); }
}

class ForbiddenError extends AppError {
  constructor(message = 'Sin permisos') { super('FORBIDDEN', message, 403); }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') { super('NOT_FOUND', message, 404); }
}

class ConflictError extends AppError {
  constructor(code, message, details = null) { super(code, message, 409, details); }
}

class BusinessError extends AppError {
  constructor(code, message, details = null) { super(code, message, 422, details); }
}

module.exports = { AppError, ValidationError, AuthError, ForbiddenError, NotFoundError, ConflictError, BusinessError };
