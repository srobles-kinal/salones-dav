const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

/**
 * Permisos override por usuario.
 * Cada fila: { id, usuario_id, permiso, tipo: 'GRANT' | 'REVOKE', creado_en, creado_por }
 * - GRANT: agrega un permiso que el rol base NO tiene
 * - REVOKE: quita un permiso que el rol base SÍ tiene
 */
class GSPermissionRepository {
  constructor() {
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.PERMISOS_USUARIO;
  }

  async findByUser(userId) {
    return this.client.findBy(this.sheet, r => r.usuario_id === userId);
  }

  async findAll() {
    return this.client.getAll(this.sheet);
  }

  /**
   * Reemplaza completamente los overrides de un usuario.
   * Estrategia: borrar (soft) los existentes y crear los nuevos.
   */
  async replaceForUser(userId, overrides, createdBy) {
    // Marcar todos los actuales como eliminados (en realidad los re-escribimos)
    const existing = await this.findByUser(userId);
    for (const e of existing) {
      await this.client.update(this.sheet, e.id, { tipo: 'DELETED' });
    }

    // Insertar los nuevos
    const { generateId } = require('../../../shared/utils/idGenerator');
    const now = new Date().toISOString();
    for (const o of overrides) {
      await this.client.append(this.sheet, {
        id: generateId(),
        usuario_id: userId,
        permiso: o.permiso,
        tipo: o.tipo,
        creado_en: now,
        creado_por: createdBy,
      });
    }
    return overrides;
  }
}

module.exports = GSPermissionRepository;
