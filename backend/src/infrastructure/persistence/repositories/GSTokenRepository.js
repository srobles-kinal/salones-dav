const ITokenRepository = require('../../../domain/repositories/ITokenRepository');
const { SHEET_NAMES } = require('../../../config/constants');
const env = require('../../../config/env');
const { getClient } = require('../GoogleSheetsClient');

class GSTokenRepository extends ITokenRepository {
  constructor() {
    super();
    this.client = getClient(env.SHEETS_DB_ID);
    this.sheet = SHEET_NAMES.TOKENS;
  }
  async create(data) { return this.client.append(this.sheet, data); }
  async findByHash(hash) {
    return this.client.findOneBy(this.sheet, r =>
      r.token_hash === hash && (r.revocado === 'FALSE' || r.revocado === false || !r.revocado));
  }
  async revoke(id) { return this.client.update(this.sheet, id, { revocado: true }); }
  async revokeAllForUser(userId) {
    const tokens = await this.client.findBy(this.sheet,
      r => r.usuario_id === userId && r.revocado !== 'TRUE');
    for (const t of tokens) {
      await this.client.update(this.sheet, t.id, { revocado: true });
    }
    return tokens.length;
  }
}
module.exports = GSTokenRepository;
