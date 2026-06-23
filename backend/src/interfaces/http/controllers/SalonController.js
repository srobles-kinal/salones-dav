const SalonService = require('../../../application/services/SalonService');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new SalonService();

exports.list = async (req, res, next) => {
  try { return ok(res, await service.list(req.query)); } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try { return ok(res, await service.getById(req.params.id)); } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try { return ok(res, await service.create(req.body, req.user.id), 201); }
  catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { return ok(res, await service.update(req.params.id, req.body, req.user.id)); }
  catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try { return ok(res, await service.delete(req.params.id)); } catch (err) { next(err); }
};

exports.restore = async (req, res, next) => {
  try { return ok(res, await service.restore(req.params.id)); } catch (err) { next(err); }
};
