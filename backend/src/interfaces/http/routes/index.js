const router = require('express').Router();
const HC = require('../controllers/HealthController');

router.get('/health', HC.live);
router.get('/health/ready', HC.ready);

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/salones', require('./salones.routes'));
router.use('/lactation', require('./lactation.routes'));
router.use('/reservations', require('./reservations.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/permissions', require('./permissions.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/email-templates', require('./email-templates.routes'));

module.exports = router;
