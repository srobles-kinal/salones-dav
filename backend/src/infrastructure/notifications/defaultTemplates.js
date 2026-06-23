/**
 * Plantillas por defecto. Se siembran en la BD en la primera migración.
 * Los SA pueden editarlas desde la UI sin tocar código.
 *
 * Variables disponibles en TODAS las plantillas:
 *   {{solicitante_nombre}}   - nombre del solicitante
 *   {{solicitante_email}}    - email del solicitante
 *   {{codigo}}               - código de la reserva (ej: RES-20260527-0001)
 *   {{tema}}                 - tema de la capacitación
 *   {{descripcion}}          - descripción de la capacitación
 *   {{salon}}                - nombre del salón
 *   {{fecha}}                - fecha (YYYY-MM-DD)
 *   {{hora_inicio}}          - hora de inicio (HH:mm)
 *   {{hora_fin}}             - hora de fin (HH:mm)
 *   {{participantes}}        - cantidad de participantes
 *   {{departamento}}         - departamento solicitante
 *
 * Solo en APROBADA / RECHAZADA:
 *   {{aprobador}}            - email/nombre de quien aprobó/rechazó
 *
 * Solo en RECHAZADA:
 *   {{motivo}}               - motivo del rechazo
 */

const BRAND_COLOR = '#0066B3';
const ACCENT = '#FFB81C';
const SUCCESS = '#00A859';
const DANGER = '#DC2626';

const baseLayout = (headerColor, titulo, bodyHTML) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:24px 0;"><tr><td align="center">
<table width="600" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
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
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;width:40%;">Código</td>
      <td style="padding:12px 16px;font-size:14px;font-family:monospace;color:#0f172a;">{{codigo}}</td></tr>
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Tema</td>
      <td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{tema}}</td></tr>
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Salón</td>
      <td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{salon}}</td></tr>
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Fecha</td>
      <td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{fecha}}</td></tr>
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Horario</td>
      <td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{hora_inicio}} - {{hora_fin}}</td></tr>
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Participantes</td>
      <td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{participantes}}</td></tr>
  <tr><td style="padding:12px 16px;background:#f8fafc;color:#475569;font-size:13px;font-weight:600;">Departamento</td>
      <td style="padding:12px 16px;font-size:14px;color:#0f172a;">{{departamento}}</td></tr>
</table>`;

const DEFAULT_TEMPLATES = {
  RESERVATION_CREATED: {
    nombre: 'Solicitud recibida (PENDIENTE)',
    estado: 'PENDIENTE',
    asunto: 'Solicitud recibida · {{codigo}}',
    texto: 'Estimado(a) {{solicitante_nombre}},\n\nHemos recibido tu solicitud de reserva {{codigo}} para "{{tema}}" el {{fecha}} de {{hora_inicio}} a {{hora_fin}} en {{salon}}. Está pendiente de aprobación.\n\nRecibirás otro correo cuando sea aprobada o rechazada.',
    html: baseLayout(ACCENT, '📋 Solicitud recibida', `
<p style="font-size:15px;color:#0f172a;margin:0 0 12px;">Estimado(a) <strong>{{solicitante_nombre}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">
Hemos recibido tu solicitud de reserva de capacitación. Está pendiente de revisión por parte del equipo administrativo. Recibirás un nuevo correo cuando tu solicitud sea aprobada o rechazada.
</p>
${detailsTable}
<div style="background:#fef3c7;border-left:4px solid ${ACCENT};padding:14px 18px;border-radius:4px;margin-top:20px;">
<p style="margin:0;font-size:13px;color:#78350f;"><strong>Estado actual:</strong> PENDIENTE DE APROBACIÓN</p>
</div>`),
  },

  RESERVATION_APPROVED: {
    nombre: 'Reserva aprobada (APROBADA)',
    estado: 'APROBADA',
    asunto: '✅ Reserva aprobada · {{codigo}}',
    texto: 'Estimado(a) {{solicitante_nombre}},\n\nTu reserva {{codigo}} ha sido APROBADA por {{aprobador}}.\n\nDetalles:\nTema: {{tema}}\nSalón: {{salon}}\nFecha: {{fecha}}\nHorario: {{hora_inicio}} - {{hora_fin}}',
    html: baseLayout(SUCCESS, '✅ Reserva aprobada', `
<p style="font-size:15px;color:#0f172a;margin:0 0 12px;">Estimado(a) <strong>{{solicitante_nombre}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">
Nos complace informarte que tu solicitud de reserva ha sido <strong>aprobada</strong> por {{aprobador}}. El salón queda reservado para ti en la fecha y horario indicados.
</p>
${detailsTable}
<div style="background:#d1fae5;border-left:4px solid ${SUCCESS};padding:14px 18px;border-radius:4px;margin-top:20px;">
<p style="margin:0 0 8px;font-size:13px;color:#065f46;"><strong>Recordatorios importantes:</strong></p>
<ul style="margin:0;padding-left:20px;font-size:13px;color:#065f46;">
<li>Llega con 15 minutos de anticipación</li>
<li>Si necesitas cancelar, hazlo lo antes posible para liberar el espacio</li>
<li>Conserva este correo como comprobante</li>
</ul></div>`),
  },

  RESERVATION_REJECTED: {
    nombre: 'Reserva rechazada (RECHAZADA)',
    estado: 'RECHAZADA',
    asunto: 'Reserva rechazada · {{codigo}}',
    texto: 'Estimado(a) {{solicitante_nombre}},\n\nLamentamos informarte que tu solicitud de reserva {{codigo}} ha sido rechazada por {{aprobador}}.\n\nMotivo: {{motivo}}\n\nDetalles:\nTema: {{tema}}\nSalón: {{salon}}\nFecha: {{fecha}}\nHorario: {{hora_inicio}} - {{hora_fin}}',
    html: baseLayout(DANGER, '❌ Reserva rechazada', `
<p style="font-size:15px;color:#0f172a;margin:0 0 12px;">Estimado(a) <strong>{{solicitante_nombre}}</strong>,</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">
Lamentamos informarte que tu solicitud de reserva ha sido <strong>rechazada</strong> por {{aprobador}}.
</p>
${detailsTable}
<div style="background:#fee2e2;border-left:4px solid ${DANGER};padding:14px 18px;border-radius:4px;margin-top:20px;">
<p style="margin:0 0 6px;font-size:13px;color:#7f1d1d;font-weight:600;">Motivo del rechazo:</p>
<p style="margin:0;font-size:13px;color:#7f1d1d;">{{motivo}}</p>
</div>
<p style="font-size:13px;color:#475569;line-height:1.6;margin-top:20px;">
Si tienes preguntas o deseas presentar una nueva solicitud, puedes acceder al sistema o contactar al equipo administrativo.
</p>`),
  },
};

module.exports = { DEFAULT_TEMPLATES };
