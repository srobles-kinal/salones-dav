const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas peticiones' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, error: { code: 'TOO_MANY_LOGIN_ATTEMPTS', message: 'Demasiados intentos de login' } },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { success: false, error: { code: 'TOO_MANY_REFRESH', message: 'Demasiados refresh' } },
});

module.exports = { globalLimiter, authLimiter, refreshLimiter };
