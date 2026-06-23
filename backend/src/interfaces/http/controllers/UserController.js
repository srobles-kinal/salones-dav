const UserService = require('../../../application/services/UserService');
const { ok } = require('../../../shared/utils/responseHelper');
const userService = new UserService();

exports.list = async (req, res, next) => {
  try { return ok(res, await userService.list()); } catch (err) { next(err); }
};
exports.getById = async (req, res, next) => {
  try { return ok(res, await userService.getById(req.params.id)); } catch (err) { next(err); }
};
exports.create = async (req, res, next) => {
  try { return ok(res, await userService.create(req.body, req.user.id), 201); }
  catch (err) { next(err); }
};
exports.update = async (req, res, next) => {
  try { return ok(res, await userService.update(req.params.id, req.body)); }
  catch (err) { next(err); }
};
exports.changeRole = async (req, res, next) => {
  try { return ok(res, await userService.changeRole(req.params.id, req.body.rol)); }
  catch (err) { next(err); }
};
exports.setActive = async (req, res, next) => {
  try { return ok(res, await userService.setActive(req.params.id, req.body.activo)); }
  catch (err) { next(err); }
};
exports.delete = async (req, res, next) => {
  try { await userService.delete(req.params.id); return ok(res, { deleted: true }); }
  catch (err) { next(err); }
};
