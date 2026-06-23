const GSConfigRepository = require('../../infrastructure/persistence/repositories/GSConfigRepository');
const { getEmailSender } = require('../../infrastructure/notifications/EmailSender');
const { ValidationError } = require('../../shared/errors/AppError');
const { CONFIG_KEYS, DEFAULT_CONFIG } = require('../../config/constants');

class SettingsService {
  constructor() { this.repo = new GSConfigRepository(); }

  async getAll() {
    const config = await this.repo.getAll();
    // Ocultar password SMTP en respuestas (solo mostrar si está vacío o no)
    return {
      ...config,
      SMTP_PASS: config.SMTP_PASS ? '****' : '',
      _SMTP_PASS_SET: !!config.SMTP_PASS,
    };
  }

  async getRaw() {
    return this.repo.getAll();
  }

  async update(updates, userId) {
    // Validar claves
    for (const k of Object.keys(updates)) {
      if (!CONFIG_KEYS.includes(k)) {
        throw new ValidationError(`Clave de configuración desconocida: ${k}`);
      }
    }

    // No sobrescribir password con valor enmascarado
    if (updates.SMTP_PASS === '****' || updates.SMTP_PASS === '') {
      delete updates.SMTP_PASS;
    }

    // Validaciones específicas
    if (updates.LACTATION_DURATION_MIN !== undefined) {
      const v = Number(updates.LACTATION_DURATION_MIN);
      if (isNaN(v) || v < 5 || v > 180) {
        throw new ValidationError('Duración de lactancia debe ser entre 5 y 180 minutos');
      }
    }
    if (updates.LACTATION_MAX_CONCURRENT !== undefined) {
      const v = Number(updates.LACTATION_MAX_CONCURRENT);
      if (isNaN(v) || v < 1 || v > 20) {
        throw new ValidationError('Capacidad simultánea debe ser entre 1 y 20');
      }
    }
    if (updates.SMTP_PORT !== undefined) {
      const v = Number(updates.SMTP_PORT);
      if (isNaN(v) || v < 1 || v > 65535) {
        throw new ValidationError('Puerto SMTP inválido');
      }
    }

    await this.repo.setMany(updates, userId);

    // Invalidar caché del EmailSender si se tocó algo de SMTP
    const smtpKeys = ['EMAIL_ENABLED', 'EMAIL_FROM', 'EMAIL_FROM_NAME',
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE'];
    if (Object.keys(updates).some(k => smtpKeys.includes(k))) {
      getEmailSender().invalidateCache();
    }

    return this.getAll();
  }

  async testEmail() {
    return getEmailSender().testConnection();
  }
}

module.exports = SettingsService;
