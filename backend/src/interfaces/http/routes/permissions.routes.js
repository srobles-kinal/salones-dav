const router = require('express').Router();
const PC = require('../controllers/PermissionController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { audit } = require('../middlewares/audit.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);

// Catálogo de permisos disponibles (cualquier usuario autenticado puede leerlo)
router.get('/catalog', PC.catalog);

// Mis permisos efectivos
router.get('/me', PC.myPermissions);

// Permisos de un usuario específico (solo quien gestiona)
router.get('/users/:userId',
  requirePermissions(PERMISSIONS.PERMISSIONS_MANAGE),
  PC.getUserPermissions);

// Actualizar permisos de un usuario
router.put('/users/:userId',
  requirePermissions(PERMISSIONS.PERMISSIONS_MANAGE),
  audit('PERMISSIONS_UPDATE', 'permisos_usuario'),
  PC.updateUserPermissions);

module.exports = router;
