const ReservationService = require('../../../application/services/ReservationService');
const { PERMISSIONS } = require('../../../config/constants');
const { ok } = require('../../../shared/utils/responseHelper');
const service = new ReservationService();

exports.list = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    const perms = req.user.permissions || [];

    // BUG FIX: Si NO tiene permiso de ver todas, filtra solo las propias.
    // El USR ahora SÍ verá sus reservas porque tiene 'reservation:read:own' en sus permisos.
    if (!perms.includes(PERMISSIONS.RESERVATION_READ_ALL)) {
      if (perms.includes(PERMISSIONS.RESERVATION_READ_OWN)) {
        filters.userId = req.user.id;
      } else {
        // Sin permiso de leer, retorna vacío
        return ok(res, []);
      }
    }
    return ok(res, await service.list(filters));
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const reservation = await service.getById(req.params.id);
    const perms = req.user.permissions || [];

    // Si no puede ver todas y no es propietario, denegar
    if (!perms.includes(PERMISSIONS.RESERVATION_READ_ALL)
        && reservation.creado_por !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No puedes ver esta reserva' },
      });
    }
    return ok(res, reservation);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await service.create(req.body, req.user);
    return ok(res, result, 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const reservation = await service.getById(req.params.id);
    const perms = req.user.permissions || [];
    const canAny = perms.includes(PERMISSIONS.RESERVATION_UPDATE_ANY);
    if (!canAny && reservation.creado_por !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No puedes editar esta reserva' },
      });
    }
    return ok(res, await service.update(req.params.id, req.body, req.user));
  } catch (err) { next(err); }
};

exports.approve = async (req, res, next) => {
  try { return ok(res, await service.approve(req.params.id, req.user)); }
  catch (err) { next(err); }
};

exports.reject = async (req, res, next) => {
  try { return ok(res, await service.reject(req.params.id, req.user, req.body.motivo)); }
  catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const perms = req.user.permissions || [];
    const canAny = perms.includes(PERMISSIONS.RESERVATION_CANCEL_ANY);
    return ok(res, await service.cancel(req.params.id, req.user.id, canAny));
  } catch (err) { next(err); }
};

/**
 * Devuelve reservas en formato compatible con FullCalendar/vista calendario.
 * GET /reservations/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.calendar = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const perms = req.user.permissions || [];
    const filters = { from, to };

    if (!perms.includes(PERMISSIONS.RESERVATION_READ_ALL)) {
      if (perms.includes(PERMISSIONS.RESERVATION_READ_OWN)) {
        filters.userId = req.user.id;
      } else {
        return ok(res, []);
      }
    }

    const reservations = await service.list(filters);
    // Solo mostrar las que importan en el calendario
    const visibles = reservations.filter(r =>
      ['PENDIENTE', 'APROBADA', 'COMPLETADA'].includes(r.estado)
    );

    const events = visibles.map(r => ({
      id: r.id,
      codigo: r.codigo,
      title: `${r.tema} (${r.solicitante_nombre})`,
      start: `${r.fecha}T${r.hora_inicio}:00`,
      end: `${r.fecha}T${r.hora_fin}:00`,
      estado: r.estado,
      salon_id: r.salon_id,
      solicitante: r.solicitante_nombre,
      departamento: r.departamento,
      participantes: r.cantidad_participantes,
      esPropio: r.creado_por === req.user.id,
    }));

    return ok(res, events);
  } catch (err) { next(err); }
};
