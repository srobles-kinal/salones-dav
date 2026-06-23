const jwtProvider = require('../../../infrastructure/security/JwtProvider');
const { AuthError } = require('../../../shared/errors/AppError');
const PermissionService = require('../../../application/services/PermissionService');

const permissionService = new PermissionService();

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new AuthError('Token de acceso requerido');
    }
    const token = auth.substring(7);
    const payload = jwtProvider.verifyAccess(token);

    // Calcular permisos efectivos (rol base + overrides)
    const effectivePermissions = await permissionService.getEffectivePermissions(
      payload.sub,
      payload.rol,
    );

    req.user = {
      id: payload.sub,
      rol: payload.rol,
      email: payload.email,
      permissions: effectivePermissions,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AuthError('Token expirado'));
    if (err.name === 'JsonWebTokenError') return next(new AuthError('Token inválido'));
    next(err);
  }
};