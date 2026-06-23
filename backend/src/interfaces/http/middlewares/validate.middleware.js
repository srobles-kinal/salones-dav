const { validationResult } = require('express-validator');
const { ValidationError } = require('../../../shared/errors/AppError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return next(new ValidationError('Datos inválidos', details));
  }
  next();
};
