const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');
const { generateId } = require('../../../shared/utils/idGenerator');

/**
 * Plantillas de email:
 * { id, codigo, asunto, html, texto, actualizado_en, actualizado_por }
 */
class GSEmailTemplateRepository {
  constructor() {
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.PLANTILLAS_EMAIL;
  }

  async findAll() { return this.client.getAll(this.sheet); }

  async findByCode(codigo) {
    return this.client.findOneBy(this.sheet, r => r.codigo === codigo);
  }

  async upsert(codigo, data, userId) {
    const existing = await this.findByCode(codigo);
    const now = new Date().toISOString();
    if (existing) {
      return this.client.update(this.sheet, existing.id, {
        ...data, actualizado_en: now, actualizado_por: userId,
      });
    }
    return this.client.append(this.sheet, {
      id: generateId(), codigo, ...data,
      actualizado_en: now, actualizado_por: userId,
    });
  }
}

module.exports = GSEmailTemplateRepository;
