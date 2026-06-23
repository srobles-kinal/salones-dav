/**
 * Crea el usuario inicial Super Admin (SA).
 * Uso: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');

const SA_EMAIL = process.env.SEED_SA_EMAIL || 'admin@muniguate.gt';
const SA_PASSWORD = process.env.SEED_SA_PASSWORD || 'Admin123Cambiar!';
const SA_NAME = 'Super Administrador';

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SHEETS_DB_ID;

async function run() {
  console.log(`🌱 Creando usuario SA con email: ${SA_EMAIL}`);
  const hash = await bcrypt.hash(SA_PASSWORD, 12);

  // Verificar si ya existe
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId, range: 'usuarios!A:Z',
  });
  const rows = existing.data.values || [];
  if (rows.length > 1) {
    const headers = rows[0];
    const emailIdx = headers.indexOf('email');
    const exists = rows.slice(1).some(r => r[emailIdx]?.toLowerCase() === SA_EMAIL.toLowerCase());
    if (exists) {
      console.log('⚠️  Ya existe un usuario con ese email. Abortando.');
      return;
    }
  }

  const user = {
    id: uuidv4(),
    email: SA_EMAIL.toLowerCase(),
    password_hash: hash,
    nombre_completo: SA_NAME,
    rol: 'SA',
    departamento: 'TI',
    activo: 'TRUE',
    intentos_fallidos: '0',
    bloqueado_hasta: '',
    ultimo_login: '',
    creado_en: new Date().toISOString(),
    creado_por: 'system',
    actualizado_en: '',
  };

  const headers = ['id','email','password_hash','nombre_completo','rol','departamento','activo','intentos_fallidos','bloqueado_hasta','ultimo_login','creado_en','creado_por','actualizado_en'];
  const row = headers.map(h => user[h] ?? '');

  await sheets.spreadsheets.values.append({
    spreadsheetId, range: 'usuarios!A:Z',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  // Crear 3 salones por defecto
  console.log('🏛️ Creando salones por defecto...');
  const salones = [
    { codigo: 'SAL-LACT-01', nombre: 'Sala de Lactancia', tipo: 'LACTANCIA', capacidad: 3, descripcion: 'Espacio acondicionado para lactancia con sillones y privacidad' },
    { codigo: 'SAL-CAP-01', nombre: 'Salón de Capacitación A', tipo: 'CAPACITACION', capacidad: 30, descripcion: 'Salón equipado con proyector y pizarra' },
    { codigo: 'SAL-CAP-02', nombre: 'Salón de Capacitación B', tipo: 'CAPACITACION', capacidad: 25, descripcion: 'Salón con mesa de juntas' },
  ];

  const salonHeaders = ['id','codigo','nombre','tipo','capacidad','descripcion','activo','creado_en'];
  const salonRows = salones.map(s => salonHeaders.map(h => {
    if (h === 'id') return uuidv4();
    if (h === 'activo') return 'TRUE';
    if (h === 'creado_en') return new Date().toISOString();
    return s[h] ?? '';
  }));

  await sheets.spreadsheets.values.append({
    spreadsheetId, range: 'salones!A:Z',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: salonRows },
  });

  console.log('\n✅ Seed completado.');
  console.log(`📧 Email:    ${SA_EMAIL}`);
  console.log(`🔐 Password: ${SA_PASSWORD}`);
  console.log('\n⚠️  CAMBIA LA CONTRASEÑA INMEDIATAMENTE DESPUÉS DEL PRIMER LOGIN');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
