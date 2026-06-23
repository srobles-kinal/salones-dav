const router = require('express').Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const authMw = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authLimiter, refreshLimiter } = require('../middlewares/rateLimit.middleware');
const { audit } = require('../middlewares/audit.middleware');

router.post('/login',
  authLimiter,
  audit('LOGIN', 'auth'),
  [body('email').isEmail(), body('password').isString().notEmpty()],
  validate,
  AuthController.login,
);

router.post('/refresh', refreshLimiter, AuthController.refresh);
router.post('/logout', authMw, audit('LOGOUT', 'auth'), AuthController.logout);
router.get('/me', authMw, AuthController.me);
router.post('/change-password',
  authMw,
  audit('CHANGE_PASSWORD', 'auth'),
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  validate,
  AuthController.changePassword,
);

module.exports = router;
