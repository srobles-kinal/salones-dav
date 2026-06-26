/**
 * Migración v1.3: agrega BREVO_API_KEY a la hoja configuracion.
 * Idempotente: si ya existe la clave, no hace nada.
 * Uso: node scripts/migrate-brevo.js
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

async function run() {
  console.log('🚀 Migración v1.3 (Brevo) iniciada...\n');

  // Leer todas las filas de configuracion
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId, range: 'configuracion!A:Z',
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];

  const claveCol = headers.indexOf('clave');
  if (claveCol === -1) {
    throw new Error('La hoja configuracion no tiene columna "clave". ¿Corriste migrate primero?');
  }

  // ¿Ya existe BREVO_API_KEY?
  const exists = rows.slice(1).some(r => r[claveCol] === 'BREVO_API_KEY');
  if (exists) {
    console.log('ℹ️  BREVO_API_KEY ya existe en configuracion. Nada que hacer.');
    return;
  }

  // Insertar nueva fila
  const now = new Date().toISOString();
  const newRow = headers.map(h => {
    if (h === 'id') return uuidv4();
    if (h === 'clave') return 'BREVO_API_KEY';
    if (h === 'valor') return '';
    if (h === 'tipo') return 'string';
    if (h === 'actualizado_en') return now;
    if (h === 'actualizado_por') return 'system';
    return '';
  });

  await sheetsApi.spreadsheets.values.append({
    spreadsheetId, range: 'configuracion!A:Z',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [newRow] },
  });
  console.log('🌱 BREVO_API_KEY insertada en configuracion (valor vacío).');
  console.log('\n✅ Migración v1.3 completada.');
  console.log('   Ahora ingresa la API key desde Configuración en la app.');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
