const { ForbiddenError } = require('../../../shared/errors/AppError');

/**
 * Verifica que el usuario tenga TODOS los permisos requeridos (AND).
 * Usa los permisos efectivos calculados en auth.middleware.
 */
const requirePermissions = (...required) => (req, res, next) => {
  if (!req.user) return next(new ForbiddenError('No autenticado'));
  const perms = req.user.permissions || [];
  const ok = required.every(p => perms.includes(p));
  if (!ok) return next(new ForbiddenError('Permisos insuficientes'));
  next();
};

/**
 * Verifica que el usuario tenga AL MENOS UNO de los permisos (OR).
 */
const requireAnyPermission = (...options) => (req, res, next) => {
  if (!req.user) return next(new ForbiddenError('No autenticado'));
  const perms = req.user.permissions || [];
  const ok = options.some(p => perms.includes(p));
  if (!ok) return next(new ForbiddenError('Permisos insuficientes'));
  next();
};

/**
 * Permite acceso si el usuario tiene el permiso global, O si es propietario del recurso.
 */
const requireOwnershipOr = (globalPerm, getOwnerId) => async (req, res, next) => {
  try {
    if (!req.user) return next(new ForbiddenError('No autenticado'));
    const perms = req.user.permissions || [];
    if (perms.includes(globalPerm)) return next();
    const ownerId = await getOwnerId(req);
    if (ownerId === req.user.id) return next();
    return next(new ForbiddenError('No eres propietario del recurso'));
  } catch (err) { next(err); }
};

module.exports = { requirePermissions, requireAnyPermission, requireOwnershipOr };
