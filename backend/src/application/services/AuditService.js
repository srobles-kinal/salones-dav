const GSAuditRepository = require('../../infrastructure/persistence/repositories/GSAuditRepository');
const { generateId } = require('../../shared/utils/idGenerator');

class AuditService {
  constructor() { this.repo = new GSAuditRepository(); }

  async log({ usuario_id = null, usuario_email = null, accion, recurso = null,
    recurso_id = null, metodo_http = null, endpoint = null, ip = null,
    user_agent = null, status_code = null, payload_resumen = null,
    resultado = 'EXITO', mensaje_error = null }) {
    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      usuario_id: usuario_id || '',
      usuario_email: usuario_email || '',
      accion,
      recurso: recurso || '',
      recurso_id: recurso_id || '',
      metodo_http: metodo_http || '',
      endpoint: endpoint || '',
      ip: ip || '',
      user_agent: (user_agent || '').slice(0, 255),
      status_code: status_code || '',
      payload_resumen: payload_resumen ? JSON.stringify(payload_resumen).slice(0, 1000) : '',
      resultado,
      mensaje_error: mensaje_error || '',
    };
    return this.repo.log(entry);
  }

  async list(filters) { return this.repo.findAll(filters); }
}

module.exports = AuditService;
