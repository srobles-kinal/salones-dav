const ILactationRepository = require('../../../domain/repositories/ILactationRepository');
const LactationSession = require('../../../domain/entities/LactationSession');
const { SHEET_NAMES, ESTADOS_LACTANCIA } = require('../../../config/constants');
const { isSameDay } = require('../../../shared/utils/dateUtils');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

class GSLactationRepository extends ILactationRepository {
  constructor() {
    super();
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.LACTANCIA;
  }
  _toEntity(r) { return r ? new LactationSession(r) : null; }

  async findActive() {
    const rows = await this.client.findBy(this.sheet, r => r.estado === ESTADOS_LACTANCIA.ACTIVA);
    return rows.map(this._toEntity);
  }
  async findById(id) {
    return this._toEntity(await this.client.findById(this.sheet, id));
  }
  async countByDate(date) {
    const all = await this.client.getAll(this.sheet);
    return all.filter(r => r.creado_en && isSameDay(r.creado_en, date)).length;
  }
  async create(session) {
    await this.client.append(this.sheet, session);
    return this._toEntity(session);
  }
  async update(id, data) {
    return this._toEntity(await this.client.update(this.sheet, id, data));
  }
  async findHistory({ from, to, limit = 100 } = {}) {
    let rows = await this.client.getAll(this.sheet);
    if (from) rows = rows.filter(r => new Date(r.creado_en) >= new Date(from));
    if (to) rows = rows.filter(r => new Date(r.creado_en) <= new Date(to));
    rows.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
    return rows.slice(0, limit).map(this._toEntity);
  }
}
module.exports = GSLactationRepository;
