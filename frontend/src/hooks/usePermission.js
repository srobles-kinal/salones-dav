import { useAuth } from '../context/AuthContext';

/**
 * Devuelve helpers basados en los permisos efectivos del usuario,
 * calculados en el backend (rol base + overrides).
 */
export const usePermission = () => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  return {
    permissions,
    role: user?.rol,
    hasPermission: (perm) => permissions.includes(perm),
    hasAnyPermission: (...perms) => perms.some(p => permissions.includes(p)),
    hasAllPermissions: (...perms) => perms.every(p => permissions.includes(p)),
  };
};
