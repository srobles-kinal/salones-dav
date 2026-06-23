const { ok } = require('../../../shared/utils/responseHelper');

exports.live = (req, res) => ok(res, { status: 'ok', timestamp: new Date().toISOString() });
exports.ready = (req, res) => ok(res, { status: 'ready', timestamp: new Date().toISOString() });
