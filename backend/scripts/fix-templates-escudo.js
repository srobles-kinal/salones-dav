/**
 * Reescribe las plantillas de correo con el escudo institucional en el header.
 * Sistema de Salones DAV · Dirección de Atención al Vecino · Muniguate
 * Autor: Sergio Robles García
 *
 * Uso: node scripts/fix-templates-escudo.js
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

const ESCUDO = 'data:image/png;base64,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';

const ACCENT = '#FFB81C', SUCCESS = '#00A859', DANGER = '#DC2626';

const baseLayout = (headerColor, titulo, bodyHTML) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:24px 0;"><tr><td align="center">
<table width="600" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${headerColor};padding:24px 32px;color:#fff;">
<table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="vertical-align:middle;width:64px;"><img src="${ESCUDO}" alt="Escudo Muniguate" width="54" style="display:block;"></td>
<td style="vertical-align:middle;padding-left:14px;">
<h1 style="margin:0;font-size:22px;font-weight:700;">${titulo}</h1>
<p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Sistema de Salones · Atención al Vecino · Muniguate</p>
</td></tr></table>
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
  console.log('🛡️  Aplicando escudo a las plantillas de correo...\n');
  const res = await sheetsApi.spreadsheets.values.get({ spreadsheetId, range: 'plantillas_email!A:Z' });
  const rows = res.data.values || [];
  const headers = rows[0] || ['id', 'codigo', 'asunto', 'html', 'texto', 'actualizado_en', 'actualizado_por'];
  const col = (n) => headers.indexOf(n);
  const now = new Date().toISOString();

  const existingByCode = {};
  rows.slice(1).forEach((r, i) => { const c = r[col('codigo')]; if (c) existingByCode[c] = i + 2; });

  for (const [codigo, tpl] of Object.entries(TEMPLATES)) {
    const rowData = headers.map(h => {
      switch (h) {
        case 'id': return existingByCode[codigo] ? (rows[existingByCode[codigo]-1][col('id')] || uuidv4()) : uuidv4();
        case 'codigo': return codigo;
        case 'asunto': return tpl.asunto;
        case 'html': return tpl.html;
        case 'texto': return tpl.texto;
        case 'actualizado_en': return now;
        case 'actualizado_por': return 'escudo-script';
        default: return '';
      }
    });
    if (existingByCode[codigo]) {
      const rowNum = existingByCode[codigo];
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: `plantillas_email!A${rowNum}:${String.fromCharCode(64+headers.length)}${rowNum}`,
        valueInputOption: 'RAW', requestBody: { values: [rowData] },
      });
      console.log(`✅ Actualizada con escudo: ${codigo}`);
    } else {
      await sheetsApi.spreadsheets.values.append({
        spreadsheetId, range: 'plantillas_email!A:Z',
        valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values: [rowData] },
      });
      console.log(`🌱 Insertada con escudo: ${codigo}`);
    }
  }
  console.log('\n✅ Listo. Reinicia el backend o espera 60s (caché de plantillas).');
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
