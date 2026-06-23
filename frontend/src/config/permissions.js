const USR = [
  'dashboard:read','lactation:create','lactation:end',
  'reservation:create','reservation:read:own','reservation:cancel:own',
];
const ADMIN = [
  ...USR,
  'lactation:read:all','reservation:read:all','reservation:cancel:any',
  'reservation:approve','reservation:reject','salones:manage','reports:read','users:read',
];
const SA = [
  ...ADMIN,
  'users:create','users:update','users:delete','users:change_role',
  'audit:read','system:config',
];

export const ROLE_PERMISSIONS = { USR, ADMIN, SA };

export const hasPermission = (rol, perm) =>
  (ROLE_PERMISSIONS[rol] || []).includes(perm);
