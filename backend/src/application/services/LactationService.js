const AsyncLock = require('async-lock');
const GSLactationRepository = require('../../infrastructure/persistence/repositories/GSLactationRepository');
const GSConfigRepository = require('../../infrastructure/persistence/repositories/GSConfigRepository');
const { BusinessError, NotFoundError } = require('../../shared/errors/AppError');
const { generateId, generateTicket } = require('../../shared/utils/idGenerator');
const { addMinutes } = require('../../shared/utils/dateUtils');
const { ESTADOS_LACTANCIA } = require('../../config/constants');
const logger = require('../../config/logger');

const lock = new AsyncLock({ timeout: 5000 });

class LactationService {
  constructor() {
    this.repo = new GSLactationRepository();
    this.configRepo = new GSConfigRepository();
  }

  async _getConfig() {
    const config = await this.configRepo.getAll();
    return {
      maxConcurrent: config.LACTATION_MAX_CONCURRENT,
      durationMin: config.LACTATION_DURATION_MIN,
    };
  }

  async getActive() {
    const active = await this.repo.findActive();
    const config = await this._getConfig();
    const now = Date.now();
    return active.map(s => {
      const restMs = new Date(s.hora_salida_estimada).getTime() - now;
      return {
        ...s,
        tiempo_restante_segundos: Math.max(0, Math.floor(restMs / 1000)),
        duracion_min_config: config.durationMin,
        expirada: restMs <= 0,
      };
    });
  }

  async checkIn({ nombre_madre, nombre_bebe, salon_id, registrado_por }) {
    if (!nombre_madre || !salon_id) throw new BusinessError('VALIDATION', 'Datos incompletos');
    const config = await this._getConfig();

    return lock.acquire('lactation:checkin', async () => {
      const active = await this.repo.findActive();
      const trulyActive = active.filter(s => new Date(s.hora_salida_estimada) > new Date());

      if (trulyActive.length >= config.maxConcurrent) {
        const earliest = trulyActive.reduce((min, s) =>
          new Date(s.hora_salida_estimada) < new Date(min.hora_salida_estimada) ? s : min);
        const waitMin = Math.ceil((new Date(earliest.hora_salida_estimada) - Date.now()) / 60000);
        throw new BusinessError('CAPACITY_FULL',
          `Los ${config.maxConcurrent} espacios están ocupados. Espera estimada: ${waitMin} min`,
          { espera_estimada_min: waitMin });
      }

      const now = new Date();
      const horaSalidaEstimada = addMinutes(now, config.durationMin);
      const count = await this.repo.countByDate(now);
      const ticket = generateTicket('LAC', now, count + 1);

      const session = {
        id: generateId(),
        ticket,
        nombre_madre,
        nombre_bebe: nombre_bebe || '',
        salon_id,
        hora_ingreso: now.toISOString(),
        hora_salida_estimada: horaSalidaEstimada.toISOString(),
        hora_salida_real: '',
        estado: ESTADOS_LACTANCIA.ACTIVA,
        finalizado_por: '',
        observaciones: '',
        registrado_por,
        creado_en: now.toISOString(),
      };

      await this.repo.create(session);
      return {
        ...session,
        tiempo_restante_segundos: config.durationMin * 60,
        duracion_min_config: config.durationMin,
      };
    });
  }

  /**
   * Finaliza una sesión. Es idempotente: si ya está finalizada/expirada,
   * devuelve la sesión sin error (FIX del bug de doble clic).
   */
  async checkOut(id, userId) {
    return lock.acquire(`lactation:checkout:${id}`, async () => {
      const session = await this.repo.findById(id);
      if (!session) throw new NotFoundError('Sesión no encontrada');

      // IDEMPOTENCIA: si ya fue finalizada o expirada, devolvemos tal cual sin error
      if (session.estado === ESTADOS_LACTANCIA.FINALIZADA ||
          session.estado === ESTADOS_LACTANCIA.EXPIRADA) {
        logger.info('checkOut idempotente: sesión ya terminada', { id, estado: session.estado });
        return session;
      }

      const updates = {
        hora_salida_real: new Date().toISOString(),
        estado: ESTADOS_LACTANCIA.FINALIZADA,
        finalizado_por: userId,
      };
      const updated = await this.repo.update(id, updates);
      logger.info('Sesión de lactancia finalizada', { id, ticket: session.ticket, userId });
      return updated;
    });
  }

  /**
   * Editar datos de una sesión activa (corregir nombres, agregar observaciones).
   */
  async update(id, data, userId) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundError('Sesión no encontrada');

    const allowed = ['nombre_madre', 'nombre_bebe', 'observaciones'];
    const filtered = {};
    for (const k of allowed) if (k in data) filtered[k] = data[k];
    if (Object.keys(filtered).length === 0) {
      throw new BusinessError('VALIDATION', 'No hay campos válidos para actualizar');
    }
    return this.repo.update(id, filtered);
  }

  /**
   * Eliminar (soft) una sesión. Marca el estado como ELIMINADA. Solo permitido
   * a usuarios con permiso `lactation:delete`.
   */
  async delete(id, userId) {
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundError('Sesión no encontrada');
    if (session.estado === 'ELIMINADA') return session;

    const updates = {
      estado: 'ELIMINADA',
      finalizado_por: userId,
      observaciones: (session.observaciones || '') + ` [Eliminada por ${userId} el ${new Date().toISOString()}]`,
    };
    return this.repo.update(id, updates);
  }

  async getById(id) {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError('Sesión no encontrada');
    return s;
  }

  async history({ from, to, limit }) {
    return this.repo.findHistory({ from, to, limit });
  }

  async expireOldSessions() {
    const active = await this.repo.findActive();
    const now = new Date();
    let count = 0;
    for (const s of active) {
      if (new Date(s.hora_salida_estimada) < now) {
        await this.repo.update(s.id, { estado: ESTADOS_LACTANCIA.EXPIRADA });
        count++;
      }
    }
    return count;
  }
}

module.exports = LactationService;
