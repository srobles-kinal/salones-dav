class IReservationRepository {
  async findAll(_filters) { throw new Error('Not implemented'); }
  async findById(_id) { throw new Error('Not implemented'); }
  async findBySalonAndDate(_salonId, _fecha) { throw new Error('Not implemented'); }
  async findByUser(_userId) { throw new Error('Not implemented'); }
  async create(_data) { throw new Error('Not implemented'); }
  async update(_id, _data) { throw new Error('Not implemented'); }
}
module.exports = IReservationRepository;
