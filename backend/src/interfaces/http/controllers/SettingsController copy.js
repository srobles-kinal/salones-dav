const SettingsService = require('../../../application/services/SettingsService');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new SettingsService();

exports.get = async (req, res, next) => {
  try { return ok(res, await service.getAll()); } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { return ok(res, await service.update(req.body, req.user.id)); }
  catch (err) { next(err); }
};

exports.testEmail = async (req, res, next) => {
  try { return ok(res, await service.testEmail()); } catch (err) { next(err); }
};

exports.publicConfig = async (req, res, next) => {
  try {
    // Sólo expone valores no sensibles (para usar en frontend sin login)
    const config = await service.getRaw();
    return ok(res, {
      LACTATION_DURATION_MIN: config.LACTATION_DURATION_MIN,
      LACTATION_MAX_CONCURRENT: config.LACTATION_MAX_CONCURRENT,
    });
  } catch (err) { next(err); }
};
