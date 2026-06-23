const router = require('express').Router();
const SC = require('../controllers/SettingsController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

router.get('/', requirePermissions(PERMISSIONS.SETTINGS_READ), SC.get);
router.put('/',
  requirePermissions(PERMISSIONS.SETTINGS_UPDATE),
  audit('SETTINGS_UPDATE', 'configuracion'),
  SC.update);
router.post('/test-email',
  requirePermissions(PERMISSIONS.SETTINGS_UPDATE),
  audit('SETTINGS_TEST_EMAIL', 'configuracion'),
  SC.testEmail);
router.get('/public', SC.publicConfig);

module.exports = router;
