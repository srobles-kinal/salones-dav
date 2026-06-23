const GSLactationRepository = require('../../infrastructure/persistence/repositories/GSLactationRepository');
const GSReservationRepository = require('../../infrastructure/persistence/repositories/GSReservationRepository');
const { ESTADOS_LACTANCIA, ESTADOS_RESERVA, LACTATION_MAX_CONCURRENT } = require('../../config/constants');

class ReportService {
  constructor() {
    this.lactRepo = new GSLactationRepository();
    this.resRepo = new GSReservationRepository();
  }

  async dashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const activeLact = await this.lactRepo.findActive();
    const reservationsAll = await this.resRepo.findAll({});

    const reservationsToday = reservationsAll.filter(r => r.fecha === today);
    const pending = reservationsAll.filter(r => r.estado === ESTADOS_RESERVA.PENDIENTE);

    const lactToday = await this.lactRepo.findHistory({
      from: today + 'T00:00:00.000Z', to: today + 'T23:59:59.999Z', limit: 1000,
    });

    return {
      lactancia: {
        activas: activeLact.length,
        capacidad_max: LACTATION_MAX_CONCURRENT,
        ocupacion_porcentaje: Math.round((activeLact.length / LACTATION_MAX_CONCURRENT) * 100),
        atendidas_hoy: lactToday.length,
      },
      reservas: {
        hoy: reservationsToday.length,
        pendientes: pending.length,
        aprobadas_hoy: reservationsToday.filter(r => r.estado === ESTADOS_RESERVA.APROBADA).length,
      },
    };
  }

  async occupancy({ from, to }) {
    const lact = await this.lactRepo.findHistory({ from, to, limit: 5000 });
    const res = await this.resRepo.findAll({ from, to });
    const byDay = {};
    [...lact].forEach(s => {
      const d = (s.creado_en || '').slice(0,10);
      if (!d) return;
      byDay[d] = byDay[d] || { fecha: d, lactancia: 0, reservas: 0 };
      byDay[d].lactancia++;
    });
    res.forEach(r => {
      const d = r.fecha;
      if (!d) return;
      byDay[d] = byDay[d] || { fecha: d, lactancia: 0, reservas: 0 };
      byDay[d].reservas++;
    });
    return Object.values(byDay).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}

module.exports = ReportService;
