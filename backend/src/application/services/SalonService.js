const GSSalonRepository = require('../../infrastructure/persistence/repositories/GSSalonRepository');
const { NotFoundError } = require('../../shared/errors/AppError');
const { generateId } = require('../../shared/utils/idGenerator');

class SalonService {
  constructor() { this.repo = new GSSalonRepository(); }
  async list() { return this.repo.findAll(); }
  async getById(id) {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError('Salón no encontrado');
    return s;
  }
  async create(data) {
    const salon = {
      id: generateId(),
      codigo: data.codigo,
      nombre: data.nombre,
      tipo: data.tipo,
      capacidad: data.capacidad || 0,
      descripcion: data.descripcion || '',
      activo: true,
      creado_en: new Date().toISOString(),
    };
    return this.repo.create(salon);
  }
  async update(id, data) { return this.repo.update(id, data); }
}
module.exports = SalonService;
