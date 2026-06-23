class ITokenRepository {
  async create(_data) { throw new Error('Not implemented'); }
  async findByHash(_hash) { throw new Error('Not implemented'); }
  async revoke(_id) { throw new Error('Not implemented'); }
  async revokeAllForUser(_userId) { throw new Error('Not implemented'); }
}
module.exports = ITokenRepository;
