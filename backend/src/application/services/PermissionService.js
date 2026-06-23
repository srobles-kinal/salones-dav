const { ROLE_PERMISSIONS, PERMISSIONS_CATALOG } = require('../../config/constants');
const GSPermissionRepository = require('../../infrastructure/persistence/repositories/GSPermissionRepository');
const GSUserRepository = require('../../infrastructure/persistence/repositories/GSUserRepository');
const { NotFoundError } = require('../../shared/errors/AppError');

class PermissionService {
  constructor() {
    this.repo = new GSPermissionRepository();
    this.userRepo = new GSUserRepository();
  }

  /**
   * Devuelve el conjunto efectivo de permisos para un usuario.
   * = permisos del rol + GRANTs override - REVOKEs override
   */
  async getEffectivePermissions(userId, rol) {
    const basePerms = ROLE_PERMISSIONS[rol] || [];
    const overrides = await this.repo.findByUser(userId);

    const granted = new Set(basePerms);
    for (const o of overrides) {
      if (o.tipo === 'GRANT') granted.add(o.permiso);
      if (o.tipo === 'REVOKE') granted.delete(o.permiso);
    }
    return Array.from(granted);
  }

  async hasPermission(userId, rol, permiso) {
    const effective = await this.getEffectivePermissions(userId, rol);
    return effective.includes(permiso);
  }

  /**
   * Para la UI: devuelve un detalle por permiso de cada módulo
   * indicando si el usuario lo tiene, si viene del rol base o de un override.
   */
  async getUserPermissionsDetail(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const basePerms = new Set(ROLE_PERMISSIONS[user.rol] || []);
    const overrides = await this.repo.findByUser(userId);

    const overrideMap = {};
    for (const o of overrides) {
      if (o.tipo === 'GRANT' || o.tipo === 'REVOKE') {
        overrideMap[o.permiso] = o.tipo;
      }
    }

    const detail = PERMISSIONS_CATALOG.map(modulo => ({
      modulo: modulo.modulo,
      permisos: modulo.permisos.map(p => {
        const inBase = basePerms.has(p.code);
        const override = overrideMap[p.code] || null;
        let efectivo = inBase;
        if (override === 'GRANT') efectivo = true;
        if (override === 'REVOKE') efectivo = false;
        return {
          code: p.code,
          label: p.label,
          inBase,
          override,
          efectivo,
        };
      }),
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
      },
      detail,
    };
  }

  /**
   * Actualiza los overrides de un usuario.
   * `selections` es array de { code, efectivo: boolean }.
   * Determina qué necesita GRANT/REVOKE comparando con el rol base.
   */
  async updateUserPermissions(userId, selections, createdBy) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const basePerms = new Set(ROLE_PERMISSIONS[user.rol] || []);
    const overrides = [];

    for (const s of selections) {
      const inBase = basePerms.has(s.code);
      if (s.efectivo && !inBase) {
        overrides.push({ permiso: s.code, tipo: 'GRANT' });
      } else if (!s.efectivo && inBase) {
        overrides.push({ permiso: s.code, tipo: 'REVOKE' });
      }
      // Si efectivo coincide con inBase, no se necesita override
    }

    await this.repo.replaceForUser(userId, overrides, createdBy);
    return this.getUserPermissionsDetail(userId);
  }

  getCatalog() {
    return PERMISSIONS_CATALOG;
  }
}

module.exports = PermissionService;
