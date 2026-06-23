const PermissionService = require('../../../application/services/PermissionService');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new PermissionService();

exports.catalog = async (req, res, next) => {
  try { return ok(res, service.getCatalog()); } catch (err) { next(err); }
};

exports.getUserPermissions = async (req, res, next) => {
  try { return ok(res, await service.getUserPermissionsDetail(req.params.userId)); }
  catch (err) { next(err); }
};

exports.updateUserPermissions = async (req, res, next) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'selections debe ser un array' },
      });
    }
    return ok(res, await service.updateUserPermissions(req.params.userId, selections, req.user.id));
  } catch (err) { next(err); }
};

exports.myPermissions = async (req, res, next) => {
  try {
    return ok(res, {
      permissions: req.user.permissions,
      rol: req.user.rol,
    });
  } catch (err) { next(err); }
};
