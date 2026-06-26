const logger = require('../../config/logger');
const GSConfigRepository = require('../persistence/repositories/GSConfigRepository');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * EmailSender vía API HTTP de Brevo.
 *
 * Razón: Render bloqueó la salida SMTP (puertos 25/465/587) en el tier free
 * desde septiembre 2025. Brevo permite enviar correos por API HTTP (puerto 443)
 * que NO está bloqueado, con tier gratis de 300 correos/día.
 *
 * Configuración necesaria en la hoja `configuracion`:
 *  - EMAIL_ENABLED        : true/false
 *  - EMAIL_FROM           : remitente (DEBE estar verificado en Brevo)
 *  - EMAIL_FROM_NAME      : nombre del remitente
 *  - BREVO_API_KEY        : API key de Brevo (xkeysib-...)
 *
 * Los campos SMTP_* heredados ya no se usan pero se conservan para no romper
 * la UI de Configuración. Si BREVO_API_KEY está vacío, se cae al modo legacy.
 */
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

      const body = {
        sender: {
          email: config.EMAIL_FROM,
          name: config.EMAIL_FROM_NAME || 'Sistema de Salones DAV',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || undefined,
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
    if (status === 400) {
      return 'Datos del correo inválidos (revisa destinatario, asunto, contenido).';
    }
    if (status === 402 || msg.includes('credit')) {
      return 'Sin créditos en Brevo. El tier gratis es 300/día; revisa tu cuenta.';
    }
    if (status === 429) {
      return 'Demasiados correos enviados en poco tiempo. Espera unos minutos.';
    }
    return 'Revisa los logs y la documentación de Brevo: https://developers.brevo.com';
  }

  /**
   * Verifica que la API key sea válida haciendo una llamada al endpoint /account.
   */
  async testConnection() {
    try {
      this.invalidateCache();
      const config = await this._getConfig(true);

      if (!config.EMAIL_ENABLED) {
        return { ok: false, message: 'Email deshabilitado. Marca la casilla en Configuración.' };
      }
      if (!config.BREVO_API_KEY) {
        return { ok: false, message: 'Falta la API key de Brevo. Ingresa BREVO_API_KEY en Configuración.' };
      }
      if (!config.EMAIL_FROM) {
        return { ok: false, message: 'Falta el correo remitente (EMAIL_FROM).' };
      }

      const res = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'api-key': config.BREVO_API_KEY,
          'accept': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          ok: false,
          message: data.message || `HTTP ${res.status}`,
          hint: this._hintForBrevoError(res.status, data),
        };
      }

      const plan = data.plan?.[0]?.type || 'free';
      const credits = data.plan?.[0]?.credits ?? '?';
      return {
        ok: true,
        message: `✓ Conexión Brevo exitosa. Plan: ${plan}. Créditos: ${credits}. Cuenta: ${data.email}.`,
      };
    } catch (err) {
      logger.error('Test Brevo falló', { error: err.message });
      return {
        ok: false,
        message: err.message,
        hint: 'Error de red al contactar Brevo.',
      };
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