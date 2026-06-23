const nodemailer = require('nodemailer');
const logger = require('../../config/logger');
const GSConfigRepository = require('../persistence/repositories/GSConfigRepository');

class EmailSender {
  constructor() {
    this.configRepo = new GSConfigRepository();
    this._transporter = null;
    this._transporterKey = null;
    this._configCache = null;
    this._cacheExpiry = 0;
  }

  async _getConfig(force = false) {
    if (!force && this._configCache && Date.now() < this._cacheExpiry) {
      return this._configCache;
    }
    const config = await this.configRepo.getAll();
    this._configCache = config;
    this._cacheExpiry = Date.now() + 60_000; // 1 min
    return config;
  }

  /**
   * Construye/retorna el transporter activo. Recrea si la config cambió.
   * Clave de detección de cambios: HOST + PORT + USER + PASS + SECURE.
   * Si cualquiera cambia, se recrea el transporter.
   */
  async _getTransporter(force = false) {
    const config = await this._getConfig(force);
    if (!config.EMAIL_ENABLED) {
      logger.debug('Email deshabilitado en configuración');
      return null;
    }
    if (!config.SMTP_HOST || !config.SMTP_USER) {
      logger.warn('Email habilitado pero SMTP_HOST o SMTP_USER vacíos');
      return null;
    }

    const key = `${config.SMTP_HOST}:${config.SMTP_PORT}:${config.SMTP_USER}:${config.SMTP_SECURE}:${config.SMTP_PASS ? config.SMTP_PASS.length : 0}`;
    if (this._transporter && this._transporterKey === key) {
      return this._transporter;
    }

    logger.info('Creando nuevo transporter SMTP', {
      host: config.SMTP_HOST, port: config.SMTP_PORT, user: config.SMTP_USER, secure: config.SMTP_SECURE,
    });

    this._transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: Number(config.SMTP_PORT) || 587,
      secure: !!config.SMTP_SECURE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
      // Timeouts razonables para no colgar el sistema
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    this._transporterKey = key;
    return this._transporter;
  }

  invalidateCache() {
    this._configCache = null;
    this._cacheExpiry = 0;
    this._transporter = null;
    this._transporterKey = null;
  }

  async send({ to, subject, html, text }) {
    try {
      const transporter = await this._getTransporter();
      if (!transporter) return { ok: false, skipped: true, reason: 'Email deshabilitado o sin configurar' };

      const config = await this._getConfig();
      const from = config.EMAIL_FROM_NAME
        ? `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM}>`
        : config.EMAIL_FROM;

      const info = await transporter.sendMail({ from, to, subject, html, text });
      logger.info('Email enviado correctamente', {
        to, subject, messageId: info.messageId, response: info.response,
      });
      return { ok: true, messageId: info.messageId };
    } catch (err) {
      logger.error('Error enviando email', {
        to, subject, error: err.message, code: err.code, command: err.command,
      });
      return {
        ok: false,
        error: err.message,
        code: err.code,
        hint: this._hintForError(err),
      };
    }
  }

  /**
   * Hint humano para los errores SMTP más comunes.
   */
  _hintForError(err) {
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('eauth') || msg.includes('invalid login') || msg.includes('username and password')) {
      return 'Credenciales SMTP rechazadas. En Gmail usa contraseña de aplicación, no la del usuario.';
    }
    if (msg.includes('econnrefused')) return 'No se pudo conectar al servidor SMTP. Verifica HOST y PORT.';
    if (msg.includes('etimedout') || msg.includes('timeout')) return 'Tiempo de espera agotado. El servidor SMTP no responde o el firewall bloquea la conexión.';
    if (msg.includes('certificate') || msg.includes('self signed')) return 'Problema de certificado SSL. Si usas SMTP institucional sin SSL, desmarca la casilla "Conexión SSL".';
    if (msg.includes('relay') || msg.includes('not allowed')) return 'El servidor SMTP rechaza el envío. Verifica que tu cuenta tenga permiso de relay.';
    return 'Revisa la configuración SMTP en Configuración → Notificaciones por correo.';
  }

  async testConnection() {
    try {
      // Forzar recreación con la config más reciente
      this.invalidateCache();
      const transporter = await this._getTransporter(true);
      if (!transporter) return { ok: false, message: 'Email deshabilitado o SMTP sin configurar' };

      await transporter.verify();
      return { ok: true, message: '✓ Conexión SMTP exitosa. El servidor aceptó las credenciales.' };
    } catch (err) {
      logger.error('Test SMTP falló', { error: err.message, code: err.code });
      return {
        ok: false,
        message: err.message,
        hint: this._hintForError(err),
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
