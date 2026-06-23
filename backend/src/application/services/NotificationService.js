const { getEmailSender } = require('../../infrastructure/notifications/EmailSender');
const { EmailTemplateService } = require('./EmailTemplateService');
const { TEMPLATE_KEYS } = require('../../config/constants');
const logger = require('../../config/logger');

class NotificationService {
  constructor() {
    this.emailSender = getEmailSender();
    this.templateService = new EmailTemplateService();
  }

  _buildData(reservation, salonName, extra = {}) {
    return {
      solicitante_nombre: reservation.solicitante_nombre || '',
      solicitante_email: reservation.solicitante_email || '',
      codigo: reservation.codigo || '',
      tema: reservation.tema || '',
      descripcion: reservation.descripcion || '',
      salon: salonName || reservation.salon_id || '',
      fecha: reservation.fecha || '',
      hora_inicio: reservation.hora_inicio || '',
      hora_fin: reservation.hora_fin || '',
      participantes: reservation.cantidad_participantes || '',
      departamento: reservation.departamento || '',
      ...extra,
    };
  }

  async _sendFromTemplate(codigo, reservation, salonName, extra = {}) {
    if (!reservation.solicitante_email) {
      logger.info('Sin email del solicitante, notificación omitida', { id: reservation.id });
      return { skipped: true };
    }
    try {
      const data = this._buildData(reservation, salonName, extra);
      const rendered = await this.templateService.render(codigo, data);
      return this.emailSender.send({
        to: reservation.solicitante_email,
        subject: rendered.asunto,
        html: rendered.html,
        text: rendered.texto,
      });
    } catch (err) {
      logger.error('Error renderizando/enviando plantilla', { codigo, error: err.message });
      return { ok: false, error: err.message };
    }
  }

  notifyReservationCreated(reservation, salonName) {
    return this._sendFromTemplate(TEMPLATE_KEYS.RESERVATION_CREATED, reservation, salonName);
  }

  notifyReservationApproved(reservation, salonName, approverEmail) {
    return this._sendFromTemplate(TEMPLATE_KEYS.RESERVATION_APPROVED, reservation, salonName, {
      aprobador: approverEmail || 'el equipo administrativo',
    });
  }

  notifyReservationRejected(reservation, salonName, motivo, rejectorEmail) {
    return this._sendFromTemplate(TEMPLATE_KEYS.RESERVATION_REJECTED, reservation, salonName, {
      aprobador: rejectorEmail || 'el equipo administrativo',
      motivo: motivo || 'No se especificó motivo',
    });
  }
}

module.exports = NotificationService;
