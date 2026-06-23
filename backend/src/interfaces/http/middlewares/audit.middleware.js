const AuditService = require('../../../application/services/AuditService');
const auditService = new AuditService();

const audit = (accion, recurso) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    setImmediate(() => {
      auditService.log({
        usuario_id: req.user?.id,
        usuario_email: req.user?.email,
        accion,
        recurso,
        recurso_id: body?.data?.id || req.params.id || '',
        metodo_http: req.method,
        endpoint: req.originalUrl,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        status_code: res.statusCode,
        resultado: body?.success === false ? 'FALLO' : 'EXITO',
        mensaje_error: body?.error?.message || null,
      }).catch(() => {});
    });
    return originalJson(body);
  };
  next();
};

module.exports = { audit };
