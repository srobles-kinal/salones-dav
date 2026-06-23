const ROLES = { SA: 'SA', ADMIN: 'ADMIN', USR: 'USR' };

const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // Lactancia (CRUD COMPLETO)
  LACTATION_CREATE: 'lactation:create',
  LACTATION_READ: 'lactation:read',
  LACTATION_READ_ALL: 'lactation:read:all',
  LACTATION_UPDATE: 'lactation:update',    // NUEVO: editar nombre/observaciones
  LACTATION_END: 'lactation:end',
  LACTATION_DELETE: 'lactation:delete',    // NUEVO: eliminar sesión (admin)

  // Reservas (CRUD COMPLETO)
  RESERVATION_CREATE: 'reservation:create',
  RESERVATION_READ_OWN: 'reservation:read:own',
  RESERVATION_READ_ALL: 'reservation:read:all',
  RESERVATION_UPDATE_OWN: 'reservation:update:own',
  RESERVATION_UPDATE_ANY: 'reservation:update:any',
  RESERVATION_CANCEL_OWN: 'reservation:cancel:own',
  RESERVATION_CANCEL_ANY: 'reservation:cancel:any',
  RESERVATION_APPROVE: 'reservation:approve',
  RESERVATION_REJECT: 'reservation:reject',
  RESERVATION_DELETE: 'reservation:delete', // NUEVO: eliminar permanente

  // Calendario
  CALENDAR_READ: 'calendar:read',

  // Salones (CRUD COMPLETO)
  SALONES_READ: 'salones:read',
  SALONES_CREATE: 'salones:create',
  SALONES_UPDATE: 'salones:update',
  SALONES_DELETE: 'salones:delete',

  // Reportes
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Usuarios (CRUD COMPLETO)
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_CHANGE_ROLE: 'users:change_role',
  USERS_RESET_PASSWORD: 'users:reset_password', // NUEVO

  // Permisos
  PERMISSIONS_MANAGE: 'permissions:manage',

  // Configuración
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Plantillas de correo (NUEVO)
  EMAIL_TEMPLATES_READ: 'email_templates:read',
  EMAIL_TEMPLATES_UPDATE: 'email_templates:update',

  // Auditoría
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',  // NUEVO
};

const PERMISSIONS_CATALOG = [
  { modulo: 'Dashboard', permisos: [
    { code: PERMISSIONS.DASHBOARD_READ, label: 'Ver dashboard' },
  ]},
  { modulo: 'Lactancia', permisos: [
    { code: PERMISSIONS.LACTATION_READ, label: 'Ver sesiones activas' },
    { code: PERMISSIONS.LACTATION_CREATE, label: 'Crear sesión (check-in)' },
    { code: PERMISSIONS.LACTATION_UPDATE, label: 'Editar sesión' },
    { code: PERMISSIONS.LACTATION_END, label: 'Finalizar sesión' },
    { code: PERMISSIONS.LACTATION_DELETE, label: 'Eliminar sesión' },
    { code: PERMISSIONS.LACTATION_READ_ALL, label: 'Ver historial completo' },
  ]},
  { modulo: 'Reservas', permisos: [
    { code: PERMISSIONS.RESERVATION_CREATE, label: 'Crear reserva' },
    { code: PERMISSIONS.RESERVATION_READ_OWN, label: 'Ver mis reservas' },
    { code: PERMISSIONS.RESERVATION_READ_ALL, label: 'Ver todas las reservas' },
    { code: PERMISSIONS.RESERVATION_UPDATE_OWN, label: 'Editar mis reservas' },
    { code: PERMISSIONS.RESERVATION_UPDATE_ANY, label: 'Editar cualquier reserva' },
    { code: PERMISSIONS.RESERVATION_CANCEL_OWN, label: 'Cancelar mis reservas' },
    { code: PERMISSIONS.RESERVATION_CANCEL_ANY, label: 'Cancelar cualquier reserva' },
    { code: PERMISSIONS.RESERVATION_APPROVE, label: 'Aprobar reservas' },
    { code: PERMISSIONS.RESERVATION_REJECT, label: 'Rechazar reservas' },
    { code: PERMISSIONS.RESERVATION_DELETE, label: 'Eliminar reservas (definitivo)' },
  ]},
  { modulo: 'Calendario', permisos: [
    { code: PERMISSIONS.CALENDAR_READ, label: 'Ver calendario' },
  ]},
  { modulo: 'Salones', permisos: [
    { code: PERMISSIONS.SALONES_READ, label: 'Ver salones' },
    { code: PERMISSIONS.SALONES_CREATE, label: 'Crear salones' },
    { code: PERMISSIONS.SALONES_UPDATE, label: 'Editar salones' },
    { code: PERMISSIONS.SALONES_DELETE, label: 'Eliminar/desactivar salones' },
  ]},
  { modulo: 'Reportes', permisos: [
    { code: PERMISSIONS.REPORTS_READ, label: 'Ver reportes' },
    { code: PERMISSIONS.REPORTS_EXPORT, label: 'Exportar reportes' },
  ]},
  { modulo: 'Usuarios', permisos: [
    { code: PERMISSIONS.USERS_READ, label: 'Ver usuarios' },
    { code: PERMISSIONS.USERS_CREATE, label: 'Crear usuarios' },
    { code: PERMISSIONS.USERS_UPDATE, label: 'Editar usuarios' },
    { code: PERMISSIONS.USERS_DELETE, label: 'Desactivar usuarios' },
    { code: PERMISSIONS.USERS_CHANGE_ROLE, label: 'Cambiar rol de usuarios' },
    { code: PERMISSIONS.USERS_RESET_PASSWORD, label: 'Resetear contraseñas' },
  ]},
  { modulo: 'Sistema', permisos: [
    { code: PERMISSIONS.PERMISSIONS_MANAGE, label: 'Gestionar permisos de usuarios' },
    { code: PERMISSIONS.SETTINGS_READ, label: 'Ver configuración' },
    { code: PERMISSIONS.SETTINGS_UPDATE, label: 'Editar configuración' },
    { code: PERMISSIONS.EMAIL_TEMPLATES_READ, label: 'Ver plantillas de correo' },
    { code: PERMISSIONS.EMAIL_TEMPLATES_UPDATE, label: 'Editar plantillas de correo' },
    { code: PERMISSIONS.AUDIT_READ, label: 'Ver auditoría' },
    { code: PERMISSIONS.AUDIT_EXPORT, label: 'Exportar auditoría' },
  ]},
];

const USR_PERMS = [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.LACTATION_READ,
  PERMISSIONS.LACTATION_CREATE,
  PERMISSIONS.LACTATION_END,
  PERMISSIONS.RESERVATION_CREATE,
  PERMISSIONS.RESERVATION_READ_OWN,
  PERMISSIONS.RESERVATION_UPDATE_OWN,
  PERMISSIONS.RESERVATION_CANCEL_OWN,
  PERMISSIONS.CALENDAR_READ,
  PERMISSIONS.SALONES_READ,
];

const ADMIN_PERMS = [
  ...USR_PERMS,
  PERMISSIONS.LACTATION_UPDATE,
  PERMISSIONS.LACTATION_READ_ALL,
  PERMISSIONS.RESERVATION_READ_ALL,
  PERMISSIONS.RESERVATION_UPDATE_ANY,
  PERMISSIONS.RESERVATION_CANCEL_ANY,
  PERMISSIONS.RESERVATION_APPROVE,
  PERMISSIONS.RESERVATION_REJECT,
  PERMISSIONS.SALONES_CREATE,
  PERMISSIONS.SALONES_UPDATE,
  PERMISSIONS.SALONES_DELETE,
  PERMISSIONS.REPORTS_READ,
  PERMISSIONS.REPORTS_EXPORT,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.SETTINGS_READ,
  PERMISSIONS.EMAIL_TEMPLATES_READ,
];

const SA_PERMS = [
  ...ADMIN_PERMS,
  PERMISSIONS.LACTATION_DELETE,
  PERMISSIONS.RESERVATION_DELETE,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_UPDATE,
  PERMISSIONS.USERS_DELETE,
  PERMISSIONS.USERS_CHANGE_ROLE,
  PERMISSIONS.USERS_RESET_PASSWORD,
  PERMISSIONS.PERMISSIONS_MANAGE,
  PERMISSIONS.SETTINGS_UPDATE,
  PERMISSIONS.EMAIL_TEMPLATES_UPDATE,
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.AUDIT_EXPORT,
];

const ROLE_PERMISSIONS = {
  [ROLES.USR]: USR_PERMS,
  [ROLES.ADMIN]: ADMIN_PERMS,
  [ROLES.SA]: SA_PERMS,
};

const SHEET_NAMES = {
  USUARIOS: 'usuarios',
  SALONES: 'salones',
  LACTANCIA: 'sesiones_lactancia',
  RESERVAS: 'reservas_capacitacion',
  TOKENS: 'tokens_refresh',
  AUDIT: 'audit_logs',
  PERMISOS_USUARIO: 'permisos_usuario',
  CONFIGURACION: 'configuracion',
  PLANTILLAS_EMAIL: 'plantillas_email',  // NUEVO
};

const ESTADOS_RESERVA = {
  PENDIENTE: 'PENDIENTE', APROBADA: 'APROBADA', RECHAZADA: 'RECHAZADA',
  CANCELADA: 'CANCELADA', COMPLETADA: 'COMPLETADA',
};

const ESTADOS_LACTANCIA = {
  ACTIVA: 'ACTIVA', FINALIZADA: 'FINALIZADA', EXPIRADA: 'EXPIRADA',
};

const TEMPLATE_KEYS = {
  RESERVATION_CREATED: 'RESERVATION_CREATED',
  RESERVATION_APPROVED: 'RESERVATION_APPROVED',
  RESERVATION_REJECTED: 'RESERVATION_REJECTED',
};

const DEFAULT_CONFIG = {
  LACTATION_MAX_CONCURRENT: 3,
  LACTATION_DURATION_MIN: 30,
  EMAIL_ENABLED: false,
  EMAIL_FROM: 'no-reply@muniguate.gt',
  EMAIL_FROM_NAME: 'Sistema de Salones DAV',
  SMTP_HOST: '',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_SECURE: false,
};

const CONFIG_KEYS = Object.keys(DEFAULT_CONFIG);

module.exports = {
  ROLES, PERMISSIONS, PERMISSIONS_CATALOG, ROLE_PERMISSIONS,
  SHEET_NAMES, ESTADOS_RESERVA, ESTADOS_LACTANCIA, TEMPLATE_KEYS,
  DEFAULT_CONFIG, CONFIG_KEYS,
};
