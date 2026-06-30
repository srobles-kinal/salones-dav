/**
 * Repara las plantillas de email en la hoja plantillas_email.
 * Re-escribe las 3 plantillas con HTML limpio y correcto.
 * Úsalo si los correos llegan como HTML crudo / texto plano.
 *
 * Uso: node scripts/fix-templates.js
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

const ACCENT = '#FFB81C', SUCCESS = '#00A859', DANGER = '#DC2626';

const baseLayout = (headerColor, titulo, bodyHTML) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:24px 0;"><tr><td align="center">
<table width="600" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${headerColor};padding:24px 32px;color:#fff;">
<h1 style="margin:0;font-size:22px;font-weight:700;">${titulo}</h1>
<p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Sistema de Salones · Atención al Vecino · Muniguate</p>
</td></tr>
<tr><td style="padding:32px;">${bodyHTML}</td></tr>
<tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;text-align:center;">
Este es un correo automático. Por favor no respondas a esta dirección.<br>
<strong>Dirección de Atención al Vecino</strong> · Municipalidad de Guatemala
</td></tr></table></td></tr></table></body></html>`;

const detailsTable = `
<table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;">
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;width:40%;">Código</td><td style="padding:12px 16px;font-size:14px;font-family:monospace;color:#0f172a;">{{codigo}}</td></tr>
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Tema</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{tema}}</td></tr>
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Salón</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{salon}}</td></tr>
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Fecha</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{fecha}}</td></tr>
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Horario</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{hora_inicio}} - {{hora_fin}}</td></tr>
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Participantes</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{participantes}}</td></tr>
<tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Departamento</td><td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{departamento}}</td></tr>
</table>`;

const TEMPLATES = {
  RESERVATION_CREATED: {
    asunto: 'Solicitud recibida · {{codigo}}',
    texto: 'Estimado(a) {{solicitante_nombre}}, hemos recibido tu solicitud de reserva {{codigo}} para "{{tema}}" el {{fecha}} de {{hora_inicio}} a {{hora_fin}} en {{salon}}. Está pendiente de aprobación.',
    html: baseLayout(ACCENT, '📋 Solicitud recibida', `
<p style="font-size:15px;color:#0f172a;margin:0 0 12px;">Estimado(a) <strong>{{solicitante_nombre}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">Hemos recibido tu solicitud de reserva de capacitación. Está pendiente de revisión. Recibirás un nuevo correo cuando sea aprobada o rechazada.</p>
${detailsTable}
<div style="background:#fef3c7;border-left:4px solid ${ACCENT};padding:14px 18px;border-radius:4px;margin-top:20px;"><p style="margin:0;font-size:13px;color:#78350f;"><strong>Estado actual:</strong> PENDIENTE DE APROBACIÓN</p></div>`),
  },
  RESERVATION_APPROVED: {
    asunto: '✅ Reserva aprobada · {{codigo}}',
    texto: 'Estimado(a) {{solicitante_nombre}}, tu reserva {{codigo}} ha sido APROBADA por {{aprobador}}. Tema: {{tema}}. Salón: {{salon}}. Fecha: {{fecha}} de {{hora_inicio}} a {{hora_fin}}.',
    html: baseLayout(SUCCESS, '✅ Reserva aprobada', `
<p style="font-size:15px;color:#0f172a;margin:0 0 12px;">Estimado(a) <strong>{{solicitante_nombre}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">Nos complace informarte que tu solicitud de reserva ha sido <strong>aprobada</strong> por {{aprobador}}. El salón queda reservado para ti en la fecha y horario indicados.</p>
${detailsTable}
<div style="background:#d1fae5;border-left:4px solid ${SUCCESS};padding:14px 18px;border-radius:4px;margin-top:20px;"><p style="margin:0 0 8px;font-size:13px;color:#065f46;"><strong>Recordatorios:</strong></p><ul style="margin:0;padding-left:20px;font-size:13px;color:#065f46;"><li>Llega con 15 minutos de anticipación</li><li>Si necesitas cancelar, hazlo lo antes posible</li><li>Conserva este correo como comprobante</li></ul></div>`),
  },
  RESERVATION_REJECTED: {
    asunto: 'Reserva rechazada · {{codigo}}',
    texto: 'Estimado(a) {{solicitante_nombre}}, lamentamos informarte que tu solicitud de reserva {{codigo}} ha sido rechazada por {{aprobador}}. Motivo: {{motivo}}.',
    html: baseLayout(DANGER, '❌ Reserva rechazada', `
<p style="font-size:15px;color:#0f172a;margin:0 0 12px;">Estimado(a) <strong>{{solicitante_nombre}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">Lamentamos informarte que tu solicitud de reserva ha sido <strong>rechazada</strong> por {{aprobador}}.</p>
${detailsTable}
<div style="background:#fee2e2;border-left:4px solid ${DANGER};padding:14px 18px;border-radius:4px;margin-top:20px;"><p style="margin:0 0 6px;font-size:13px;color:#7f1d1d;font-weight:600;">Motivo del rechazo:</p><p style="margin:0;font-size:13px;color:#7f1d1d;">{{motivo}}</p></div>`),
  },
};

async function run() {
  console.log('🔧 Reparando plantillas de email...\n');

  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId, range: 'plantillas_email!A:Z',
  });
  const rows = res.data.values || [];
  const headers = rows[0] || ['id', 'codigo', 'asunto', 'html', 'texto', 'actualizado_en', 'actualizado_por'];

  const col = (name) => headers.indexOf(name);
  const now = new Date().toISOString();

  // Mapa de filas existentes por codigo
  const existingByCode = {};
  rows.slice(1).forEach((r, i) => {
    const codigo = r[col('codigo')];
    if (codigo) existingByCode[codigo] = i + 2; // fila real (1-indexed + header)
  });

  for (const [codigo, tpl] of Object.entries(TEMPLATES)) {
    const rowData = headers.map(h => {
      switch (h) {
        case 'id': return existingByCode[codigo] ? (rows[existingByCode[codigo] - 1][col('id')] || uuidv4()) : uuidv4();
        case 'codigo': return codigo;
        case 'asunto': return tpl.asunto;
        case 'html': return tpl.html;
        case 'texto': return tpl.texto;
        case 'actualizado_en': return now;
        case 'actualizado_por': return 'fix-script';
        default: return '';
      }
    });

    if (existingByCode[codigo]) {
      const rowNum = existingByCode[codigo];
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: `plantillas_email!A${rowNum}:${String.fromCharCode(64 + headers.length)}${rowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [rowData] },
      });
      console.log(`✅ Actualizada: ${codigo}`);
    } else {
      await sheetsApi.spreadsheets.values.append({
        spreadsheetId, range: 'plantillas_email!A:Z',
        valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [rowData] },
      });
      console.log(`🌱 Insertada: ${codigo}`);
    }
  }

  console.log('\n✅ Plantillas reparadas. Reinicia el backend o espera 60s (caché).');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
