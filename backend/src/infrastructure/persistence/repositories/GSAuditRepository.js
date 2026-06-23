const IAuditRepository = require('../../../domain/repositories/IAuditRepository');
const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

class GSAuditRepository extends IAuditRepository {
  constructor() {
    super();
    this.client = getClient(env.SHEETS_AUDIT_ID);
    this.sheet = SHEET_NAMES.AUDIT;
  }
  async log(entry) {
    try { return await this.client.append(this.sheet, entry); }
    catch (e) { /* logging best-effort; never break business flow */ return null; }
  }
  async findAll(filters = {}) {
    let rows = await this.client.getAll(this.sheet);
    if (filters.usuario_id) rows = rows.filter(r => r.usuario_id === filters.usuario_id);
    if (filters.accion) rows = rows.filter(r => r.accion === filters.accion);
    if (filters.from) rows = rows.filter(r => new Date(r.timestamp) >= new Date(filters.from));
    if (filters.to) rows = rows.filter(r => new Date(r.timestamp) <= new Date(filters.to));
    rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return rows.slice(0, filters.limit || 200);
  }
}
module.exports = GSAuditRepository;
