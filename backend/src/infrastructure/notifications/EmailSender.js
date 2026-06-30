const logger = require('../../config/logger');
const GSConfigRepository = require('../persistence/repositories/GSConfigRepository');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Convierte HTML a texto plano legible (para el textContent del correo).
 * Si el "texto" que recibimos en realidad es HTML, lo limpiamos aquí.
 */
function htmlToPlainText(input) {
  if (!input) return '';
  // Si no parece HTML, devolverlo tal cual
  if (!/<[a-z][\s\S]*>/i.test(input)) return input;
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, '')   // quita bloques <style>
    .replace(/<script[\s\S]*?<\/script>/gi, '') // quita <script>
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n') // saltos por bloques
    .replace(/<br\s*\/?>/gi, '\n')               // <br> -> salto
    .replace(/<[^>]+>/g, '')                     // quita el resto de etiquetas
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')                  // colapsa saltos múltiples
    .trim();
}

/**
 * Decodifica entidades HTML escapadas en el htmlContent.
 * Esto repara plantillas que se guardaron con &lt; en vez de <.
 */
function unescapeHtmlIfNeeded(html) {
  if (!html) return '';
  // Si contiene etiquetas reales, ya está bien
  if (/<[a-z][\s\S]*>/i.test(html)) return html;
  // Si está escapado (&lt;table&gt;...), lo desescapamos
  if (/&lt;[a-z]/i.test(html)) {
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }
  return html;
}

class EmailSender {
  constructor() {
    this.configRepo = new GSConfigRepository();
    this._configCache = null;
    this._cacheExpiry = 0;
  }

  async _getConfig(force = false) {
    if (!force && this._configCache && Date.now() < this._cacheExpiry) {
      return this._configCache;
    }
    const config = await this.configRepo.getAll();
    this._configCache = config;
    this._cacheExpiry = Date.now() + 60_000;
    return config;
  }

  invalidateCache() {
    this._configCache = null;
    this._cacheExpiry = 0;
  }

  async send({ to, subject, html, text }) {
    try {
      const config = await this._getConfig();

      if (!config.EMAIL_ENABLED) {
        return { ok: false, skipped: true, reason: 'Email deshabilitado en Configuración' };
      }
      if (!config.BREVO_API_KEY) {
        return { ok: false, skipped: true, reason: 'BREVO_API_KEY no configurada' };
      }
      if (!config.EMAIL_FROM) {
        return { ok: false, skipped: true, reason: 'EMAIL_FROM no configurado' };
      }

      // === FIX CORREO HTML CRUDO ===
      // 1. Asegurar que el HTML sea HTML real (desescapar si vino con &lt;)
      const cleanHtml = unescapeHtmlIfNeeded(html);
      // 2. Generar texto plano de verdad: si nos pasaron HTML como "texto",
      //    o no nos pasaron texto, lo derivamos del HTML limpio.
      let cleanText = text;
      if (!cleanText || /<[a-z][\s\S]*>/i.test(cleanText)) {
        cleanText = htmlToPlainText(cleanHtml);
      }

      const body = {
        sender: {
          email: config.EMAIL_FROM,
          name: config.EMAIL_FROM_NAME || 'Sistema de Salones DAV',
        },
        to: [{ email: to }],
        subject,
        htmlContent: cleanHtml,
        textContent: cleanText || undefined,
      };

      const res = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.BREVO_API_KEY,
          'accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        logger.error('Error enviando email vía Brevo', {
          to, subject, status: res.status, brevoError: data,
        });
        return {
          ok: false,
          error: data.message || data.code || `HTTP ${res.status}`,
          hint: this._hintForBrevoError(res.status, data),
        };
      }

      logger.info('Email enviado correctamente vía Brevo', {
        to, subject, messageId: data.messageId,
      });
      return { ok: true, messageId: data.messageId };

    } catch (err) {
      logger.error('Excepción al enviar email vía Brevo', {
        to, subject, error: err.message,
      });
      return {
        ok: false,
        error: err.message,
        hint: 'Error de red al contactar Brevo. Verifica conexión a internet.',
      };
    }
  }

  _hintForBrevoError(status, data) {
    const code = data.code || '';
    const msg = (data.message || '').toLowerCase();
    if (status === 401 || code === 'unauthorized') {
      return 'API key de Brevo inválida o revocada. Genera una nueva en app.brevo.com → SMTP & API.';
    }
    if (status === 400 && msg.includes('sender')) {
      return 'El EMAIL_FROM no está verificado en Brevo. Ve a Brevo → Senders y verifica esa dirección.';
    }
    if (status === 400) return 'Datos del correo inválidos (revisa destinatario, asunto, contenido).';
    if (status === 402 || msg.includes('credit')) return 'Sin créditos en Brevo. El tier gratis es 300/día.';
    if (status === 429) return 'Demasiados correos en poco tiempo. Espera unos minutos.';
    return 'Revisa los logs y la documentación de Brevo: https://developers.brevo.com';
  }

  async testConnection() {
    try {
      this.invalidateCache();
      const config = await this._getConfig(true);
      if (!config.EMAIL_ENABLED) return { ok: false, message: 'Email deshabilitado. Marca la casilla en Configuración.' };
      if (!config.BREVO_API_KEY) return { ok: false, message: 'Falta la API key de Brevo.' };
      if (!config.EMAIL_FROM) return { ok: false, message: 'Falta el correo remitente (EMAIL_FROM).' };

      const res = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: { 'api-key': config.BREVO_API_KEY, 'accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, message: data.message || `HTTP ${res.status}`, hint: this._hintForBrevoError(res.status, data) };
      }
      const plan = data.plan?.[0]?.type || 'free';
      const credits = data.plan?.[0]?.credits ?? '?';
      return { ok: true, message: `✓ Conexión Brevo exitosa. Plan: ${plan}. Créditos: ${credits}. Cuenta: ${data.email}.` };
    } catch (err) {
      logger.error('Test Brevo falló', { error: err.message });
      return { ok: false, message: err.message, hint: 'Error de red al contactar Brevo.' };
    }
  }
}

let _instance = null;
module.exports = {
  getEmailSender: () => {
    if (!_instance) _instance = new EmailSender();
    return _instance;
  },
};