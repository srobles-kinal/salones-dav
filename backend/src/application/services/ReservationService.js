/**
 * ReservationService — Lógica de negocio de reservas de capacitación.
 * Sistema de Gestión y Reservación de Salones
 * Dirección de Atención al Vecino · Municipalidad de Guatemala
 *
 * Autor: Sergio Robles García
 */
const GSReservationRepository = require('../../infrastructure/persistence/repositories/GSReservationRepository');
const GSSalonRepository = require('../../infrastructure/persistence/repositories/GSSalonRepository');
const GSUserRepository = require('../../infrastructure/persistence/repositories/GSUserRepository');
const NotificationService = require('./NotificationService');
const logger = require('../../config/logger');
const { ConflictError, NotFoundError, BusinessError, ValidationError } = require('../../shared/errors/AppError');
const { generateId, generateTicket } = require('../../shared/utils/idGenerator');
const { timeToMinutes } = require('../../shared/utils/dateUtils');
const { ESTADOS_RESERVA } = require('../../config/constants');

class ReservationService {
  constructor() {
    this.repo = new GSReservationRepository();
    this.salonRepo = new GSSalonRepository();
    this.userRepo = new GSUserRepository();
    this.notifier = new NotificationService();
  }

  async _getSalonName(salonId) {
    try {
      const salon = await this.salonRepo.findById(salonId);
      return salon?.nombre || salonId;
    } catch { return salonId; }
  }

  /**
   * Devuelve el nombre completo de un usuario a partir de su id.
   * Si no se encuentra, retorna el email como respaldo, y si tampoco, el id.
   */
  async _getUserDisplayName(userId, fallbackEmail) {
    try {
      const u = await this.userRepo.findById(userId);
      return u?.nombre_completo || u?.nombre || fallbackEmail || userId;
    } catch {
      return fallbackEmail || userId;
    }
  }

  _checkOverlap(existing, newStart, newEnd, excludeId = null) {
    return existing.some(r => {
      if (r.id === excludeId) return false;
      if (![ESTADOS_RESERVA.APROBADA, ESTADOS_RESERVA.PENDIENTE].includes(r.estado)) return false;
      const s = timeToMinutes(r.hora_inicio);
      const e = timeToMinutes(r.hora_fin);
      return newStart < e && newEnd > s;
    });
  }

  async list(filters) { return this.repo.findAll(filters); }

  async getById(id) {
    const r = await this.repo.findById(id);
    if (!r) throw new NotFoundError('Reserva no encontrada');
    return r;
  }

  async create(data, user) {
    const required = ['solicitante_nombre', 'departamento', 'cantidad_participantes',
      'tema', 'salon_id', 'fecha', 'hora_inicio', 'hora_fin'];
    for (const k of required) if (!data[k]) throw new ValidationError(`Campo requerido: ${k}`);

    const startMin = timeToMinutes(data.hora_inicio);
    const endMin = timeToMinutes(data.hora_fin);
    if (startMin >= endMin) throw new ValidationError('La hora de inicio debe ser anterior a la hora de fin');

    const fechaReserva = new Date(data.fecha);
    if (fechaReserva < new Date(new Date().toISOString().slice(0, 10))) {
      throw new ValidationError('La fecha no puede ser pasada');
    }

    const existing = await this.repo.findBySalonAndDate(data.salon_id, data.fecha);
    if (this._checkOverlap(existing, startMin, endMin)) {
      throw new ConflictError('TIME_CONFLICT', 'Existe una reserva activa o aprobada en este horario');
    }

    const now = new Date();
    const count = await this.repo.countByDate(now);
    const codigo = generateTicket('RES', now, count + 1);

    const reservation = {
      id: generateId(),
      codigo,
      solicitante_nombre: data.solicitante_nombre,
      solicitante_email: data.solicitante_email || '',
      solicitante_telefono: data.solicitante_telefono || '',
      departamento: data.departamento,
      cantidad_participantes: data.cantidad_participantes,
      tema: data.tema,
      descripcion: data.descripcion || '',
      salon_id: data.salon_id,
      fecha: data.fecha,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      estado: ESTADOS_RESERVA.PENDIENTE,
      motivo_rechazo: '',
      aprobada_por: '',
      aprobada_en: '',
      creado_por: user.id,
      creado_en: now.toISOString(),
      actualizado_en: '',
    };

    const created = await this.repo.create(reservation);

    const salonName = await this._getSalonName(data.salon_id);
    this.notifier.notifyReservationCreated(created, salonName)
      .catch(err => logger.error('Email error PENDIENTE', { err: err.message }));

    return created;
  }

  async update(id, data, user) {
    const existing = await this.getById(id);
    if (existing.estado !== ESTADOS_RESERVA.PENDIENTE) {
      throw new BusinessError('INVALID_STATE',
        'Solo se pueden editar reservas en estado PENDIENTE');
    }

    const willChange = ['fecha', 'hora_inicio', 'hora_fin', 'salon_id'].some(k => k in data);
    if (willChange) {
      const fecha = data.fecha || existing.fecha;
      const salon = data.salon_id || existing.salon_id;
      const inicio = data.hora_inicio || existing.hora_inicio;
      const fin = data.hora_fin || existing.hora_fin;

      const startMin = timeToMinutes(inicio);
      const endMin = timeToMinutes(fin);
      if (startMin >= endMin) throw new ValidationError('Hora inicio debe ser anterior a hora fin');

      const otras = await this.repo.findBySalonAndDate(salon, fecha);
      if (this._checkOverlap(otras, startMin, endMin, id)) {
        throw new ConflictError('TIME_CONFLICT', 'Existe traslape de horario');
      }
    }

    const allowed = ['solicitante_nombre', 'solicitante_email', 'solicitante_telefono',
      'departamento', 'cantidad_participantes', 'tema', 'descripcion',
      'salon_id', 'fecha', 'hora_inicio', 'hora_fin'];
    const filtered = {};
    for (const k of allowed) if (k in data) filtered[k] = data[k];
    return this.repo.update(id, filtered);
  }

  async approve(id, user) {
    const r = await this.getById(id);

    // Idempotencia: si ya está aprobada, devolverla sin reprocesar ni reenviar correo.
    if (r.estado === ESTADOS_RESERVA.APROBADA) {
      logger.info('approve idempotente: reserva ya aprobada', { id });
      return r;
    }
    if (r.estado !== ESTADOS_RESERVA.PENDIENTE) {
      throw new BusinessError('INVALID_STATE', `No se puede aprobar una reserva en estado ${r.estado}`);
    }

    const updated = await this.repo.update(id, {
      estado: ESTADOS_RESERVA.APROBADA,
      aprobada_por: user.id,
      aprobada_en: new Date().toISOString(),
    });

    const salonName = await this._getSalonName(updated.salon_id);
    const aprobadorNombre = await this._getUserDisplayName(user.id, user.email);
    this.notifier.notifyReservationApproved(updated, salonName, aprobadorNombre)
      .catch(err => logger.error('Email error APROBADA', { err: err.message }));

    return updated;
  }

  async reject(id, user, motivo) {
    const r = await this.getById(id);

    // Idempotencia: si ya está rechazada, devolverla sin reprocesar ni reenviar correo.
    if (r.estado === ESTADOS_RESERVA.RECHAZADA) {
      logger.info('reject idempotente: reserva ya rechazada', { id });
      return r;
    }
    if (r.estado !== ESTADOS_RESERVA.PENDIENTE) {
      throw new BusinessError('INVALID_STATE', `No se puede rechazar una reserva en estado ${r.estado}`);
    }

    const motivoFinal = motivo || 'Sin motivo especificado';
    const updated = await this.repo.update(id, {
      estado: ESTADOS_RESERVA.RECHAZADA,
      aprobada_por: user.id,
      aprobada_en: new Date().toISOString(),
      motivo_rechazo: motivoFinal,
    });

    const salonName = await this._getSalonName(updated.salon_id);
    const rechazadorNombre = await this._getUserDisplayName(user.id, user.email);
    this.notifier.notifyReservationRejected(updated, salonName, motivoFinal, rechazadorNombre)
      .catch(err => logger.error('Email error RECHAZADA', { err: err.message }));

    return updated;
  }

  async cancel(id, userId, canCancelAny = false) {
    const r = await this.getById(id);
    if (!canCancelAny && r.creado_por !== userId) {
      throw new BusinessError('NOT_OWNER', 'Solo puedes cancelar tus propias reservas');
    }
    // Idempotencia: si ya está cancelada, devolverla sin error.
    if (r.estado === ESTADOS_RESERVA.CANCELADA) {
      return r;
    }
    if (r.estado === ESTADOS_RESERVA.COMPLETADA) {
      throw new BusinessError('INVALID_STATE', `No se puede cancelar una reserva ${r.estado}`);
    }
    return this.repo.update(id, { estado: ESTADOS_RESERVA.CANCELADA });
  }
}

module.exports = ReservationService;