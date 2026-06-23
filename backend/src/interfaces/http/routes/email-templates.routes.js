const router = require('express').Router();
const EC = require('../controllers/EmailTemplateController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

router.get('/', requirePermissions(PERMISSIONS.EMAIL_TEMPLATES_READ), EC.list);
router.get('/:codigo', requirePermissions(PERMISSIONS.EMAIL_TEMPLATES_READ), EC.get);

router.put('/:codigo',
  requirePermissions(PERMISSIONS.EMAIL_TEMPLATES_UPDATE),
  audit('EMAIL_TEMPLATE_UPDATE', 'plantillas_email'),
  EC.update);

router.post('/:codigo/reset',
  requirePermissions(PERMISSIONS.EMAIL_TEMPLATES_UPDATE),
  audit('EMAIL_TEMPLATE_RESET', 'plantillas_email'),
  EC.reset);

router.post('/preview',
  requirePermissions(PERMISSIONS.EMAIL_TEMPLATES_READ),
  EC.preview);

router.post('/send-test',
  requirePermissions(PERMISSIONS.EMAIL_TEMPLATES_UPDATE),
  audit('EMAIL_TEMPLATE_TEST', 'plantillas_email'),
  EC.sendTest);

module.exports = router;
