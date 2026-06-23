const router = require('express').Router();
const LC = require('../controllers/LactationController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions, requireAnyPermission } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

router.get('/active', requirePermissions(PERMISSIONS.LACTATION_READ), LC.getActive);
router.get('/history',
  requireAnyPermission(PERMISSIONS.LACTATION_READ_ALL, PERMISSIONS.LACTATION_READ),
  LC.history);
router.get('/:id', requirePermissions(PERMISSIONS.LACTATION_READ), LC.getById);

router.post('/check-in',
  requirePermissions(PERMISSIONS.LACTATION_CREATE),
  audit('LACTATION_CHECK_IN', 'sesiones_lactancia'),
  LC.checkIn);

router.put('/:id',
  requirePermissions(PERMISSIONS.LACTATION_UPDATE),
  audit('LACTATION_UPDATE', 'sesiones_lactancia'),
  LC.update);

router.patch('/:id/check-out',
  requirePermissions(PERMISSIONS.LACTATION_END),
  audit('LACTATION_CHECK_OUT', 'sesiones_lactancia'),
  LC.checkOut);

router.delete('/:id',
  requirePermissions(PERMISSIONS.LACTATION_DELETE),
  audit('LACTATION_DELETE', 'sesiones_lactancia'),
  LC.delete);

module.exports = router;
