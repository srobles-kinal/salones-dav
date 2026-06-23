const GSSalonRepository = require('../../infrastructure/persistence/repositories/GSSalonRepository');
const { NotFoundError, ValidationError, ConflictError } = require('../../shared/errors/AppError');
const { generateId } = require('../../shared/utils/idGenerator');

const TIPOS_VALIDOS = ['LACTANCIA', 'CAPACITACION'];

class SalonService {
  constructor() { this.repo = new GSSalonRepository(); }

  async list({ tipo, activo } = {}) {
    let salones = await this.repo.findAll();
    if (tipo) salones = salones.filter(s => s.tipo === tipo);
    if (activo !== undefined) {
      const want = activo === 'true' || activo === true;
      salones = salones.filter(s => (s.activo === 'TRUE' || s.activo === true) === want);
    }
    return salones;
  }

  async getById(id) {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError('Salón no encontrado');
    return s;
  }

  _validate(data) {
    if (!data.nombre) throw new ValidationError('El nombre es obligatorio');
    if (!data.tipo) throw new ValidationError('El tipo es obligatorio');
    if (!TIPOS_VALIDOS.includes(data.tipo)) {
      throw new ValidationError(`Tipo inválido. Permitidos: ${TIPOS_VALIDOS.join(', ')}`);
    }
    const cap = parseInt(data.capacidad, 10);
    if (isNaN(cap) || cap < 1) throw new ValidationError('Capacidad debe ser un entero positivo');
  }

  async create(data, userId) {
    this._validate(data);
    // Validar nombre único
    const all = await this.repo.findAll();
    if (all.some(s => s.nombre.toLowerCase() === data.nombre.toLowerCase())) {
      throw new ConflictError('DUPLICATE', 'Ya existe un salón con ese nombre');
    }
    const salon = {
      id: generateId(),
      nombre: data.nombre.trim(),
      tipo: data.tipo,
      capacidad: parseInt(data.capacidad, 10),
      ubicacion: data.ubicacion || '',
      descripcion: data.descripcion || '',
      activo: true,
      creado_por: userId,
      creado_en: new Date().toISOString(),
      actualizado_en: '',
    };
    return this.repo.create(salon);
  }

  async update(id, data, userId) {
    const existing = await this.getById(id);
    const allowed = ['nombre', 'tipo', 'capacidad', 'ubicacion', 'descripcion', 'activo'];
    const filtered = {};
    for (const k of allowed) if (k in data) filtered[k] = data[k];

    if (filtered.tipo && !TIPOS_VALIDOS.includes(filtered.tipo)) {
      throw new ValidationError(`Tipo inválido. Permitidos: ${TIPOS_VALIDOS.join(', ')}`);
    }
    if (filtered.capacidad !== undefined) {
      const cap = parseInt(filtered.capacidad, 10);
      if (isNaN(cap) || cap < 1) throw new ValidationError('Capacidad debe ser positiva');
      filtered.capacidad = cap;
    }
    if (filtered.nombre && filtered.nombre !== existing.nombre) {
      const all = await this.repo.findAll();
      if (all.some(s => s.id !== id && s.nombre.toLowerCase() === filtered.nombre.toLowerCase())) {
        throw new ConflictError('DUPLICATE', 'Ya existe un salón con ese nombre');
      }
    }
    filtered.actualizado_en = new Date().toISOString();
    return this.repo.update(id, filtered);
  }

  /**
   * Soft delete: marca el salón como inactivo. No se elimina físicamente
   * para preservar la integridad referencial con reservas históricas.
   */
  async delete(id) {
    const existing = await this.getById(id);
    return this.repo.update(id, { activo: false, actualizado_en: new Date().toISOString() });
  }

  /**
   * Reactivar un salón previamente desactivado.
   */
  async restore(id) {
    await this.getById(id);
    return this.repo.update(id, { activo: true, actualizado_en: new Date().toISOString() });
  }
}

module.exports = SalonService;
