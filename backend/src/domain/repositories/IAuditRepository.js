class IAuditRepository {
  async log(_entry) { throw new Error('Not implemented'); }
  async findAll(_filters) { throw new Error('Not implemented'); }
}
module.exports = IAuditRepository;
