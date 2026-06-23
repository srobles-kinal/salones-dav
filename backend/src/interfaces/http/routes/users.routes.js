const router = require('express').Router();
const { body } = require('express-validator');
const UC = require('../controllers/UserController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

router.get('/', requirePermissions(PERMISSIONS.USERS_READ), UC.list);
router.get('/:id', requirePermissions(PERMISSIONS.USERS_READ), UC.getById);
router.post('/',
  requirePermissions(PERMISSIONS.USERS_CREATE),
  audit('USER_CREATE', 'users'),
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('nombre_completo').notEmpty(),
    body('rol').isIn(['SA', 'ADMIN', 'USR']),
  ],
  validate,
  UC.create,
);
router.put('/:id', requirePermissions(PERMISSIONS.USERS_UPDATE), audit('USER_UPDATE', 'users'), UC.update);
router.patch('/:id/role',
  requirePermissions(PERMISSIONS.USERS_CHANGE_ROLE),
  audit('USER_CHANGE_ROLE', 'users'),
  [body('rol').isIn(['SA', 'ADMIN', 'USR'])], validate,
  UC.changeRole,
);
router.patch('/:id/activate',
  requirePermissions(PERMISSIONS.USERS_UPDATE),
  audit('USER_TOGGLE_ACTIVE', 'users'),
  UC.setActive,
);
router.delete('/:id',
  requirePermissions(PERMISSIONS.USERS_DELETE),
  audit('USER_DELETE', 'users'),
  UC.delete,
);

module.exports = router;
