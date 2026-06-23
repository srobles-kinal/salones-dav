const AuditService = require('../../../application/services/AuditService');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new AuditService();

exports.list = async (req, res, next) => {
  try { return ok(res, await service.list(req.query)); } catch (err) { next(err); }
};
