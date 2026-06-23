const AuthService = require('../../../application/services/AuthService');
const { ok } = require('../../../shared/utils/responseHelper');
const env = require('../../../config/env');

const authService = new AuthService();

const REFRESH_COOKIE_NAME = 'sdv_rt';
const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  maxAge: 7 * 24 * 3600 * 1000,
  path: '/api/v1/auth',
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({
      email, password,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    return ok(res, {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    const result = await authService.refresh(refreshToken);
    return ok(res, result);
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    await authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    return ok(res, { message: 'Sesión cerrada' });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => ok(res, { user: req.user });

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, { currentPassword, newPassword });
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    return ok(res, { message: 'Contraseña actualizada. Vuelve a iniciar sesión' });
  } catch (err) { next(err); }
};
