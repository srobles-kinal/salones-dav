const LactationService = require('../../../application/services/LactationService');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new LactationService();

exports.getActive = async (req, res, next) => {
  try { return ok(res, await service.getActive()); } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try { return ok(res, await service.getById(req.params.id)); } catch (err) { next(err); }
};

exports.checkIn = async (req, res, next) => {
  try {
    return ok(res, await service.checkIn({ ...req.body, registrado_por: req.user.id }), 201);
  } catch (err) { next(err); }
};

exports.checkOut = async (req, res, next) => {
  try { return ok(res, await service.checkOut(req.params.id, req.user.id)); }
  catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { return ok(res, await service.update(req.params.id, req.body, req.user.id)); }
  catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try { return ok(res, await service.delete(req.params.id, req.user.id)); }
  catch (err) { next(err); }
};

exports.history = async (req, res, next) => {
  try { return ok(res, await service.history(req.query)); } catch (err) { next(err); }
};
