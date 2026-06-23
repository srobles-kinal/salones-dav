const IUserRepository = require('../../../domain/repositories/IUserRepository');
const User = require('../../../domain/entities/User');
const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

class GSUserRepository extends IUserRepository {
  constructor() {
    super();
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.USUARIOS;
  }

  _toEntity(r) { return r ? new User(r) : null; }

  async findAll() {
    const rows = await this.client.getAll(this.sheet);
    return rows.map(this._toEntity);
  }

  async findById(id) {
    return this._toEntity(await this.client.findById(this.sheet, id));
  }

  async findByEmail(email) {
    return this._toEntity(await this.client.findOneBy(this.sheet,
      (r) => r.email?.toLowerCase() === email.toLowerCase()));
  }

  async create(user) {
    await this.client.append(this.sheet, user);
    return this._toEntity(user);
  }

  async update(id, data) {
    return this._toEntity(await this.client.update(this.sheet, id, data));
  }

  async delete(id) {
    return this.client.softDelete(this.sheet, id);
  }
}
module.exports = GSUserRepository;
