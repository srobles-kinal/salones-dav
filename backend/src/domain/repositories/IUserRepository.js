class IUserRepository {
  async findAll() { throw new Error('Not implemented'); }
  async findById(_id) { throw new Error('Not implemented'); }
  async findByEmail(_email) { throw new Error('Not implemented'); }
  async create(_user) { throw new Error('Not implemented'); }
  async update(_id, _data) { throw new Error('Not implemented'); }
  async delete(_id) { throw new Error('Not implemented'); }
}
module.exports = IUserRepository;
