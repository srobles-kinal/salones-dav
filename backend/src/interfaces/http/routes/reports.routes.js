const router = require('express').Router();
const RC = require('../controllers/ReportController');
const authMw = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../../config/constants');

router.use(authMw);
router.get('/dashboard', requirePermissions(PERMISSIONS.DASHBOARD_READ), RC.dashboard);
router.get('/occupancy', requirePermissions(PERMISSIONS.REPORTS_READ), RC.occupancy);

module.exports = router;
