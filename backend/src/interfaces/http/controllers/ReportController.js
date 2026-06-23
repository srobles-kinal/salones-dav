const ReportService = require('../../../application/services/ReportService');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new ReportService();

exports.dashboard = async (req, res, next) => {
  try { return ok(res, await service.dashboard()); } catch (err) { next(err); }
};
exports.occupancy = async (req, res, next) => {
  try { return ok(res, await service.occupancy(req.query)); } catch (err) { next(err); }
};
