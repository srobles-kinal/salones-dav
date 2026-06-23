const router = require('express').Router();
const SC = require('../controllers/SalonController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

router.get('/', requirePermissions(PERMISSIONS.SALONES_READ), SC.list);
router.get('/:id', requirePermissions(PERMISSIONS.SALONES_READ), SC.getById);

router.post('/',
  requirePermissions(PERMISSIONS.SALONES_CREATE),
  audit('SALON_CREATE', 'salones'), SC.create);

router.put('/:id',
  requirePermissions(PERMISSIONS.SALONES_UPDATE),
  audit('SALON_UPDATE', 'salones'), SC.update);

router.delete('/:id',
  requirePermissions(PERMISSIONS.SALONES_DELETE),
  audit('SALON_DELETE', 'salones'), SC.delete);

router.patch('/:id/restore',
  requirePermissions(PERMISSIONS.SALONES_UPDATE),
  audit('SALON_RESTORE', 'salones'), SC.restore);

module.exports = router;
