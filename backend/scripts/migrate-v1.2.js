/**
 * Migración v1.2: agrega hoja plantillas_email y siembra valores por defecto.
 * Uso: node scripts/migrate-v1.2.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const { DEFAULT_TEMPLATES } = require('../src/infrastructure/notifications/defaultTemplates');

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheetsApi = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SHEETS_DB_ID;

const SHEETS = {
  plantillas_email: ['id', 'codigo', 'asunto', 'html', 'texto', 'actualizado_en', 'actualizado_por'],
};

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

async function seedTemplates() {
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId, range: 'plantillas_email!A:Z',
  });
  const rows = res.data.values || [];
  if (rows.length > 1) {
    console.log('ℹ️  plantillas_email ya tiene datos. Saltando seed.');
    return;
  }

  const now = new Date().toISOString();
  const dataRows = Object.entries(DEFAULT_TEMPLATES).map(([codigo, tpl]) => [
    uuidv4(),
    codigo,
    tpl.asunto,
    tpl.html,
    tpl.texto,
    now,
    'system',
  ]);

  await sheetsApi.spreadsheets.values.append({
    spreadsheetId, range: 'plantillas_email!A:Z',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: dataRows },
  });
  console.log(`🌱 ${dataRows.length} plantillas por defecto insertadas`);
}

async function run() {
  console.log('🚀 Migración v1.2 iniciada...\n');
  for (const [name, headers] of Object.entries(SHEETS)) {
    await ensureSheet(name, headers);
  }
  console.log('');
  await seedTemplates();
  console.log('\n✅ Migración v1.2 completada.');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
