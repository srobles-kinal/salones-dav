/**
 * Inicializa todas las hojas necesarias en los spreadsheets de Google Sheets.
 * Crea encabezados de cada tabla.
 * Uso: npm run init-sheets
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');

const env = {
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  SHEETS_DB_ID: process.env.SHEETS_DB_ID,
  SHEETS_AUDIT_ID: process.env.SHEETS_AUDIT_ID,
};

const auth = new google.auth.JWT({
  email: env.GOOGLE_CLIENT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheetsApi = google.sheets({ version: 'v4', auth });

const SCHEMAS = {
  usuarios: ['id','email','password_hash','nombre_completo','rol','departamento','activo','intentos_fallidos','bloqueado_hasta','ultimo_login','creado_en','creado_por','actualizado_en'],
  salones: ['id','codigo','nombre','tipo','capacidad','descripcion','activo','creado_en'],
  sesiones_lactancia: ['id','ticket','nombre_madre','nombre_bebe','salon_id','hora_ingreso','hora_salida_estimada','hora_salida_real','estado','finalizado_por','observaciones','registrado_por','creado_en','actualizado_en'],
  reservas_capacitacion: ['id','codigo','solicitante_nombre','solicitante_email','solicitante_telefono','departamento','cantidad_participantes','tema','descripcion','salon_id','fecha','hora_inicio','hora_fin','estado','motivo_rechazo','aprobada_por','aprobada_en','creado_por','creado_en','actualizado_en'],
  tokens_refresh: ['id','usuario_id','token_hash','device_info','ip','expira_en','revocado','creado_en'],
};

const AUDIT_SCHEMA = ['id','timestamp','usuario_id','usuario_email','accion','recurso','recurso_id','metodo_http','endpoint','ip','user_agent','status_code','payload_resumen','resultado','mensaje_error'];

async function ensureSheet(spreadsheetId, sheetName, headers) {
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.some(s => s.properties.title === sheetName);
  if (!exists) {
    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    });
    console.log(`✅ Hoja creada: ${sheetName}`);
  }
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  });
  console.log(`📝 Encabezados configurados en: ${sheetName}`);
}

async function run() {
  console.log('🚀 Inicializando spreadsheet principal...');
  for (const [name, headers] of Object.entries(SCHEMAS)) {
    await ensureSheet(env.SHEETS_DB_ID, name, headers);
  }
  console.log('\n🚀 Inicializando spreadsheet de auditoría...');
  await ensureSheet(env.SHEETS_AUDIT_ID, 'audit_logs', AUDIT_SCHEMA);

  console.log('\n✅ Inicialización completada.');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
