import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Calendar, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import * as reportsApi from '../api/reportsApi';
import * as reservationsApi from '../api/reservationsApi';
import * as salonesApi from '../api/salonesApi';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import StateBadge from '../components/common/StateBadge';
import ReservationsCalendar from '../components/calendar/ReservationsCalendar';
import { usePermission } from '../hooks/usePermission';

function KPI({ icon: Icon, label, value, suffix, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value}{suffix && <span className="text-base text-slate-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('reservation:create');
  const canViewCalendar = hasPermission('calendar:read') || hasPermission('reservation:read:own') || hasPermission('reservation:read:all');

  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = () => reportsApi.dashboard().then(r => setData(r.data.data)).catch(() => {});
  const loadEvents = () => reservationsApi.calendar().then(r => setEvents(r.data.data)).catch(() => {});

  useEffect(() => {
    Promise.all([
      reportsApi.dashboard().then(r => r.data.data),
      canViewCalendar ? reservationsApi.calendar().then(r => r.data.data) : Promise.resolve([]),
      salonesApi.list().then(r => r.data.data.filter(s => s.tipo === 'CAPACITACION')),
    ]).then(([d, ev, sal]) => {
      setData(d);
      setEvents(ev);
      setSalones(sal);
    }).finally(() => setLoading(false));

    const id = setInterval(() => { loadDashboard(); if (canViewCalendar) loadEvents(); }, 30000);
    return () => clearInterval(id);
  }, []);

  const handleCreateFromCalendar = (slot) => {
    if (!canCreate) {
      toast.error('No tienes permiso para crear reservas');
      return;
    }
    if (salones.length === 0) {
      toast.error('No hay salones de capacitación configurados');
      return;
    }
    setCreateForm({
      ...slot,
      solicitante_nombre: '',
      solicitante_email: '',
      solicitante_telefono: '',
      departamento: '',
      cantidad_participantes: 1,
      tema: '',
      descripcion: '',
      salon_id: salones[0].id,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...createForm, cantidad_participantes: parseInt(createForm.cantidad_participantes, 10) };
      const r = await reservationsApi.create(payload);
      toast.success(`Solicitud creada: ${r.data.data.codigo}`);
      setCreateForm(null);
      loadEvents();
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-6">Vista general del sistema</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI icon={Baby} label="Lactancia activa" color="green"
             value={`${data?.lactancia.activas || 0}/${data?.lactancia.capacidad_max || 3}`} />
        <KPI icon={Clock} label="Atendidas hoy" color="blue" value={data?.lactancia.atendidas_hoy || 0} />
        <KPI icon={Calendar} label="Reservas hoy" color="purple" value={data?.reservas.hoy || 0} />
        <KPI icon={Users} label="Pendientes aprobación" color="yellow" value={data?.reservas.pendientes || 0} />
      </div>

      {canViewCalendar && (
        <ReservationsCalendar
          events={events}
          onCreateReservation={handleCreateFromCalendar}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Modal de detalle de evento */}
      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Detalle de reserva">
        {selectedEvent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">{selectedEvent.codigo}</span>
              <StateBadge value={selectedEvent.estado} />
            </div>
            <div><p className="text-xs text-slate-500">Tema</p><p className="font-medium">{selectedEvent.title.split(' (')[0]}</p></div>
            <div><p className="text-xs text-slate-500">Solicitante</p><p>{selectedEvent.solicitante}</p></div>
            <div><p className="text-xs text-slate-500">Departamento</p><p>{selectedEvent.departamento}</p></div>
            <div><p className="text-xs text-slate-500">Horario</p>
              <p>{selectedEvent.start.replace('T', ' ').slice(0, 16)} - {selectedEvent.end.split('T')[1]?.slice(0,5)}</p></div>
            <div><p className="text-xs text-slate-500">Participantes</p><p>{selectedEvent.participantes}</p></div>
            <div className="pt-2">
              <button onClick={() => { setSelectedEvent(null); navigate('/reservations'); }}
                      className="btn-primary w-full">
                Ir a Reservas
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de creación desde calendario */}
      <Modal open={!!createForm} onClose={() => setCreateForm(null)} title="Nueva reserva" size="lg">
        {createForm && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nombre del solicitante *</label>
              <input className="input" required value={createForm.solicitante_nombre}
                onChange={(e) => setCreateForm({ ...createForm, solicitante_nombre: e.target.value })} />
            </div>
            <div>
              <label className="label">Email del solicitante (recibirá notificaciones)</label>
              <input type="email" className="input" value={createForm.solicitante_email}
                onChange={(e) => setCreateForm({ ...createForm, solicitante_email: e.target.value })} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={createForm.solicitante_telefono}
                onChange={(e) => setCreateForm({ ...createForm, solicitante_telefono: e.target.value })} />
            </div>
            <div>
              <label className="label">Departamento *</label>
              <input className="input" required value={createForm.departamento}
                onChange={(e) => setCreateForm({ ...createForm, departamento: e.target.value })} />
            </div>
            <div>
              <label className="label">Participantes *</label>
              <input type="number" min="1" max="500" className="input" required value={createForm.cantidad_participantes}
                onChange={(e) => setCreateForm({ ...createForm, cantidad_participantes: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Tema *</label>
              <input className="input" required value={createForm.tema}
                onChange={(e) => setCreateForm({ ...createForm, tema: e.target.value })} />
            </div>
            <div>
              <label className="label">Salón *</label>
              <select className="input" required value={createForm.salon_id}
                onChange={(e) => setCreateForm({ ...createForm, salon_id: e.target.value })}>
                {salones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input type="date" className="input" required value={createForm.fecha}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCreateForm({ ...createForm, fecha: e.target.value })} />
            </div>
            <div>
              <label className="label">Hora inicio *</label>
              <input type="time" className="input" required value={createForm.hora_inicio}
                onChange={(e) => setCreateForm({ ...createForm, hora_inicio: e.target.value })} />
            </div>
            <div>
              <label className="label">Hora fin *</label>
              <input type="time" className="input" required value={createForm.hora_fin}
                onChange={(e) => setCreateForm({ ...createForm, hora_fin: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-2">
              <button type="button" onClick={() => setCreateForm(null)} className="btn-ghost flex-1" disabled={submitting}>Cancelar</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear solicitud'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
