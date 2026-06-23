const IReservationRepository = require('../../../domain/repositories/IReservationRepository');
const Reservation = require('../../../domain/entities/Reservation');
const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

class GSReservationRepository extends IReservationRepository {
  constructor() {
    super();
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.RESERVAS;
  }
  _toEntity(r) { return r ? new Reservation(r) : null; }

  async findAll(filters = {}) {
    let rows = await this.client.getAll(this.sheet);
    if (filters.estado) rows = rows.filter(r => r.estado === filters.estado);
    if (filters.userId) rows = rows.filter(r => r.creado_por === filters.userId);
    if (filters.from) rows = rows.filter(r => r.fecha >= filters.from);
    if (filters.to) rows = rows.filter(r => r.fecha <= filters.to);
    rows.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
    return rows.map(this._toEntity);
  }
  async findById(id) { return this._toEntity(await this.client.findById(this.sheet, id)); }
  async findBySalonAndDate(salonId, fecha) {
    const rows = await this.client.findBy(this.sheet,
      r => r.salon_id === salonId && r.fecha === fecha);
    return rows.map(this._toEntity);
  }
  async findByUser(userId) {
    const rows = await this.client.findBy(this.sheet, r => r.creado_por === userId);
    return rows.map(this._toEntity);
  }
  async create(data) {
    await this.client.append(this.sheet, data);
    return this._toEntity(data);
  }
  async update(id, data) {
    return this._toEntity(await this.client.update(this.sheet, id, data));
  }
  async countByDate(date) {
    const all = await this.client.getAll(this.sheet);
    const yyyymmdd = new Date(date).toISOString().slice(0,10);
    return all.filter(r => r.creado_en?.startsWith(yyyymmdd)).length;
  }
}
module.exports = GSReservationRepository;
