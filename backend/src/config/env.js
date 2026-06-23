const requiredVars = [
  'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY',
  'SHEETS_DB_ID', 'SHEETS_AUDIT_ID',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno requerida ausente: ${key}`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8080', 10),
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || '7d',

  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  SHEETS_DB_ID: process.env.SHEETS_DB_ID,
  SHEETS_AUDIT_ID: process.env.SHEETS_AUDIT_ID,

  BCRYPT_COST: parseInt(process.env.BCRYPT_COST || '12', 10),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  LOCKOUT_DURATION_MS: parseInt(process.env.LOCKOUT_DURATION_MS || '900000', 10),

  COOKIE_SECRET: process.env.COOKIE_SECRET || 'change-me',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
