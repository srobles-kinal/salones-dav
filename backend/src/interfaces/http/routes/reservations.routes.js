const router = require('express').Router();
const { body } = require('express-validator');
const RC = require('../controllers/ReservationController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions, requireAnyPermission } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

// GET / : USR con read:own ve las suyas; ADMIN con read:all ve todas
router.get('/',
  requireAnyPermission(PERMISSIONS.RESERVATION_READ_OWN, PERMISSIONS.RESERVATION_READ_ALL),
  RC.list);

// Calendario
router.get('/calendar',
  requireAnyPermission(PERMISSIONS.CALENDAR_READ, PERMISSIONS.RESERVATION_READ_OWN, PERMISSIONS.RESERVATION_READ_ALL),
  RC.calendar);

router.get('/:id',
  requireAnyPermission(PERMISSIONS.RESERVATION_READ_OWN, PERMISSIONS.RESERVATION_READ_ALL),
  RC.getById);

router.post('/',
  requirePermissions(PERMISSIONS.RESERVATION_CREATE),
  audit('RESERVATION_CREATE', 'reservas_capacitacion'),
  [
    body('solicitante_nombre').isString().notEmpty(),
    body('departamento').isString().notEmpty(),
    body('cantidad_participantes').isInt({ min: 1, max: 500 }),
    body('tema').isString().notEmpty(),
    body('salon_id').notEmpty(),
    body('fecha').isISO8601(),
    body('hora_inicio').matches(/^([0-1]\d|2[0-3]):[0-5]\d$/),
    body('hora_fin').matches(/^([0-1]\d|2[0-3]):[0-5]\d$/),
  ],
  validate,
  RC.create);

router.put('/:id',
  requireAnyPermission(PERMISSIONS.RESERVATION_UPDATE_OWN, PERMISSIONS.RESERVATION_UPDATE_ANY),
  audit('RESERVATION_UPDATE', 'reservas_capacitacion'),
  RC.update);

router.patch('/:id/approve',
  requirePermissions(PERMISSIONS.RESERVATION_APPROVE),
  audit('RESERVATION_APPROVE', 'reservas_capacitacion'),
  RC.approve);

router.patch('/:id/reject',
  requirePermissions(PERMISSIONS.RESERVATION_REJECT),
  audit('RESERVATION_REJECT', 'reservas_capacitacion'),
  RC.reject);

router.delete('/:id',
  requireAnyPermission(PERMISSIONS.RESERVATION_CANCEL_OWN, PERMISSIONS.RESERVATION_CANCEL_ANY),
  audit('RESERVATION_CANCEL', 'reservas_capacitacion'),
  RC.cancel);

module.exports = router;
