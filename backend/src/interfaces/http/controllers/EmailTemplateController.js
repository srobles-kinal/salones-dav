const { EmailTemplateService } = require('../../../application/services/EmailTemplateService');
const { getEmailSender } = require('../../../infrastructure/notifications/EmailSender');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new EmailTemplateService();

exports.list = async (req, res, next) => {
  try { return ok(res, await service.list()); } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try { return ok(res, await service.get(req.params.codigo)); } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try { return ok(res, await service.update(req.params.codigo, req.body, req.user.id)); }
  catch (err) { next(err); }
};

exports.reset = async (req, res, next) => {
  try { return ok(res, await service.resetToDefault(req.params.codigo, req.user.id)); }
  catch (err) { next(err); }
};

exports.preview = async (req, res, next) => {
  try {
    const { asunto, html, texto } = req.body;
    return ok(res, service.preview(asunto, html, texto));
  } catch (err) { next(err); }
};

/**
 * Envío de prueba: genera la plantilla con datos de ejemplo
 * y la envía a un email indicado en el body.
 */
exports.sendTest = async (req, res, next) => {
  try {
    const { codigo, to } = req.body;
    if (!to) return res.status(400).json({
      success: false, error: { code: 'VALIDATION', message: 'Indica destinatario "to"' },
    });
    const data = service.preview('', '', '').sampleData;
    const rendered = await service.render(codigo, data);
    const result = await getEmailSender().send({
      to, subject: `[PRUEBA] ${rendered.asunto}`,
      html: rendered.html, text: rendered.texto,
    });
    return ok(res, result);
  } catch (err) { next(err); }
};
