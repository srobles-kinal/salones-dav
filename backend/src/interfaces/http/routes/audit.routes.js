const router = require('express').Router();
const AC = require('../controllers/AuditController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);
router.get('/logs', requirePermissions(PERMISSIONS.AUDIT_READ), AC.list);

module.exports = router;
