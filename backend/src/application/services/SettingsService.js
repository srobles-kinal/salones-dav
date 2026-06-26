const GSConfigRepository = require('../../infrastructure/persistence/repositories/GSConfigRepository');
const { getEmailSender } = require('../../infrastructure/notifications/EmailSender');
const { ValidationError } = require('../../shared/errors/AppError');
const { CONFIG_KEYS } = require('../../config/constants');

class SettingsService {
  constructor() { this.repo = new GSConfigRepository(); }

  async getAll() {
    const config = await this.repo.getAll();
    // Enmascara valores sensibles en respuestas
    return {
      ...config,
      SMTP_PASS: config.SMTP_PASS ? '****' : '',
      _SMTP_PASS_SET: !!config.SMTP_PASS,
      BREVO_API_KEY: config.BREVO_API_KEY ? '****' : '',
      _BREVO_API_KEY_SET: !!config.BREVO_API_KEY,
    };
  }

  async getRaw() { return this.repo.getAll(); }

  async update(updates, userId) {
    for (const k of Object.keys(updates)) {
      if (!CONFIG_KEYS.includes(k)) {
        throw new ValidationError(`Clave de configuración desconocida: ${k}`);
      }
    }

    // No sobrescribir valores enmascarados
    if (updates.SMTP_PASS === '****' || updates.SMTP_PASS === '') delete updates.SMTP_PASS;
    if (updates.BREVO_API_KEY === '****' || updates.BREVO_API_KEY === '') delete updates.BREVO_API_KEY;

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

    await this.repo.setMany(updates, userId);

    // Invalida cache del EmailSender si se tocó algo relevante
    const emailKeys = ['EMAIL_ENABLED', 'EMAIL_FROM', 'EMAIL_FROM_NAME', 'BREVO_API_KEY'];
    if (Object.keys(updates).some(k => emailKeys.includes(k))) {
      getEmailSender().invalidateCache();
    }

    return this.getAll();
  }

  async testEmail() { return getEmailSender().testConnection(); }
}

module.exports = SettingsService;