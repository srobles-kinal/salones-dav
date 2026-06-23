const ISalonRepository = require('../../../domain/repositories/ISalonRepository');
const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

class GSSalonRepository extends ISalonRepository {
  constructor() {
    super();
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.SALONES;
  }
  async findAll() {
    const all = await this.client.getAll(this.sheet);
    return all.filter(s => s.activo === 'TRUE' || s.activo === true);
  }
  async findById(id) { return this.client.findById(this.sheet, id); }
  async create(salon) { return this.client.append(this.sheet, salon); }
  async update(id, data) { return this.client.update(this.sheet, id, data); }
}
module.exports = GSSalonRepository;
