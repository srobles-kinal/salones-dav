const { SHEET_NAMES, DEFAULT_CONFIG } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');
const { generateId } = require('../../../shared/utils/idGenerator');

/**
 * Configuración global en formato clave-valor.
 * Fila: { id, clave, valor, tipo: 'string' | 'number' | 'boolean', actualizado_en, actualizado_por }
 */
class GSConfigRepository {
  constructor() {
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.CONFIGURACION;
  }

  _parseValue(raw, tipo) {
    if (raw === null || raw === undefined || raw === '') return null;
    if (tipo === 'number') return Number(raw);
    if (tipo === 'boolean') return raw === 'true' || raw === 'TRUE' || raw === true;
    return String(raw);
  }

  _detectType(value) {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  }

  async getAll() {
    const rows = await this.client.getAll(this.sheet);
    const result = { ...DEFAULT_CONFIG };
    for (const row of rows) {
      if (row.clave && row.clave in DEFAULT_CONFIG) {
        result[row.clave] = this._parseValue(row.valor, row.tipo);
      }
    }
    return result;
  }

  async get(clave) {
    const row = await this.client.findOneBy(this.sheet, r => r.clave === clave);
    if (!row) return DEFAULT_CONFIG[clave];
    return this._parseValue(row.valor, row.tipo);
  }

  async set(clave, valor, userId) {
    if (!(clave in DEFAULT_CONFIG)) {
      throw new Error(`Clave de configuración desconocida: ${clave}`);
    }
    const tipo = this._detectType(DEFAULT_CONFIG[clave]);
    const existing = await this.client.findOneBy(this.sheet, r => r.clave === clave);
    const valorStr = String(valor);

    if (existing) {
      return this.client.update(this.sheet, existing.id, {
        valor: valorStr,
        tipo,
        actualizado_en: new Date().toISOString(),
        actualizado_por: userId,
      });
    }
    return this.client.append(this.sheet, {
      id: generateId(),
      clave,
      valor: valorStr,
      tipo,
      actualizado_en: new Date().toISOString(),
      actualizado_por: userId,
    });
  }

  async setMany(updates, userId) {
    for (const [clave, valor] of Object.entries(updates)) {
      await this.set(clave, valor, userId);
    }
    return this.getAll();
  }
}

module.exports = GSConfigRepository;
