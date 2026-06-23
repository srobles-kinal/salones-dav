const GSUserRepository = require('../../infrastructure/persistence/repositories/GSUserRepository');
const passwordHasher = require('../../infrastructure/security/PasswordHasher');
const { ConflictError, NotFoundError, ValidationError } = require('../../shared/errors/AppError');
const { generateId } = require('../../shared/utils/idGenerator');
const { ROLES } = require('../../config/constants');

class UserService {
  constructor() { this.repo = new GSUserRepository(); }

  async list() {
    const all = await this.repo.findAll();
    return all.map(u => u.toPublic());
  }

  async getById(id) {
    const u = await this.repo.findById(id);
    if (!u) throw new NotFoundError('Usuario no encontrado');
    return u.toPublic();
  }

  async create({ email, password, nombre_completo, rol, departamento }, creadoPor) {
    if (!Object.values(ROLES).includes(rol)) throw new ValidationError('Rol inválido');
    if (!passwordHasher.isStrong(password)) {
      throw new ValidationError('La contraseña no cumple los requisitos de seguridad');
    }
    const existing = await this.repo.findByEmail(email);
    if (existing) throw new ConflictError('EMAIL_EXISTS', 'Ya existe un usuario con ese email');

    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      password_hash: await passwordHasher.hash(password),
      nombre_completo,
      rol,
      departamento: departamento || '',
      activo: true,
      intentos_fallidos: 0,
      bloqueado_hasta: '',
      ultimo_login: '',
      creado_en: new Date().toISOString(),
      creado_por: creadoPor,
      actualizado_en: '',
    };
    const created = await this.repo.create(newUser);
    return created.toPublic();
  }

  async update(id, updates) {
    const u = await this.repo.findById(id);
    if (!u) throw new NotFoundError('Usuario no encontrado');
    const allowed = ['nombre_completo', 'departamento', 'activo'];
    const filtered = {};
    for (const k of allowed) if (k in updates) filtered[k] = updates[k];
    const updated = await this.repo.update(id, filtered);
    return updated.toPublic();
  }

  async changeRole(id, rol) {
    if (!Object.values(ROLES).includes(rol)) throw new ValidationError('Rol inválido');
    const updated = await this.repo.update(id, { rol });
    return updated.toPublic();
  }

  async setActive(id, activo) {
    const updated = await this.repo.update(id, { activo: !!activo });
    return updated.toPublic();
  }

  async delete(id) {
    return this.repo.delete(id);
  }
}

module.exports = UserService;
