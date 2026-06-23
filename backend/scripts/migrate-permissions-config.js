/**
 * Migración para agregar:
 * - Hoja permisos_usuario (overrides de permisos por usuario)
 * - Hoja configuracion (valores configurables: duración lactancia, SMTP, etc.)
 *
 * Uso: node scripts/migrate-permissions-config.js
 *      o: npm run migrate
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheetsApi = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SHEETS_DB_ID;

const SCHEMAS = {
  permisos_usuario: ['id', 'usuario_id', 'permiso', 'tipo', 'creado_en', 'creado_por'],
  configuracion: ['id', 'clave', 'valor', 'tipo', 'actualizado_en', 'actualizado_por'],
};

const DEFAULT_CONFIG_ROWS = [
  { clave: 'LACTATION_MAX_CONCURRENT', valor: '3', tipo: 'number' },
  { clave: 'LACTATION_DURATION_MIN', valor: '30', tipo: 'number' },
  { clave: 'EMAIL_ENABLED', valor: 'false', tipo: 'boolean' },
  { clave: 'EMAIL_FROM', valor: 'no-reply@muniguate.gt', tipo: 'string' },
  { clave: 'EMAIL_FROM_NAME', valor: 'Sistema de Salones DAV', tipo: 'string' },
  { clave: 'SMTP_HOST', valor: '', tipo: 'string' },
  { clave: 'SMTP_PORT', valor: '587', tipo: 'number' },
  { clave: 'SMTP_USER', valor: '', tipo: 'string' },
  { clave: 'SMTP_PASS', valor: '', tipo: 'string' },
  { clave: 'SMTP_SECURE', valor: 'false', tipo: 'boolean' },
];

async function ensureSheet(name, headers) {
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.some(s => s.properties.title === name);
  if (!exists) {
    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
    });
    console.log(`✅ Hoja creada: ${name}`);
  } else {
    console.log(`ℹ️  Hoja ya existe: ${name}`);
  }
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: `${name}!A1:${String.fromCharCode(64 + headers.length)}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  });
  console.log(`📝 Encabezados actualizados en: ${name}`);
}

async function seedDefaultConfig() {
  // Solo insertar si la hoja está vacía
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId, range: 'configuracion!A:Z',
  });
  const rows = res.data.values || [];
  if (rows.length > 1) {
    console.log('ℹ️  configuracion ya tiene datos. Saltando seed.');
    return;
  }
  const now = new Date().toISOString();
  const headers = SCHEMAS.configuracion;
  const dataRows = DEFAULT_CONFIG_ROWS.map(c => headers.map(h => {
    if (h === 'id') return uuidv4();
    if (h === 'actualizado_en') return now;
    if (h === 'actualizado_por') return 'system';
    return c[h] ?? '';
  }));

  await sheetsApi.spreadsheets.values.append({
    spreadsheetId, range: 'configuracion!A:Z',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: dataRows },
  });
  console.log(`🌱 ${dataRows.length} valores por defecto insertados en configuracion`);
}

async function run() {
  console.log('🚀 Iniciando migración...\n');
  for (const [name, headers] of Object.entries(SCHEMAS)) {
    await ensureSheet(name, headers);
  }
  console.log('');
  await seedDefaultConfig();
  console.log('\n✅ Migración completada exitosamente.');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
