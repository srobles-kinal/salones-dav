import { useEffect, useState, useCallback } from 'react';
import { Baby, Plus, LogOut as Exit, Edit2, Trash2, Clock, History } from 'lucide-react';
import toast from 'react-hot-toast';
import * as lactationApi from '../api/lactationApi';
import * as salonesApi from '../api/salonesApi';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { usePermission } from '../hooks/usePermission';

// Cronómetro que se autoactualiza cada segundo
function CountdownTimer({ initialSeconds }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    setSeconds(initialSeconds);
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [initialSeconds]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const expired = seconds <= 0;
  const lowTime = seconds < 300;
  return (
    <span className={`font-mono text-lg font-bold ${expired ? 'text-red-600' : lowTime ? 'text-orange-600' : 'text-green-700'}`}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

export default function Lactation() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('lactation:create');
  const canEnd = hasPermission('lactation:end');
  const canUpdate = hasPermission('lactation:update');
  const canDelete = hasPermission('lactation:delete');
  const canViewHistory = hasPermission('lactation:read:all');

  const [active, setActive] = useState([]);
  const [salones, setSalones] = useState([]);
  const [duration, setDuration] = useState(30);
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [loading, setLoading] = useState(true);

  // Modales
  const [checkInModal, setCheckInModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Form check-in
  const [form, setForm] = useState({ nombre_madre: '', nombre_bebe: '', salon_id: '' });

  // Form edición
  const [editForm, setEditForm] = useState({ nombre_madre: '', nombre_bebe: '', observaciones: '' });

  // === FIX DEL BUG DEL DOBLE CLIC ===
  // Estado por ID: rastrea qué sesión está siendo procesada para deshabilitar el botón.
  const [processingId, setProcessingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await lactationApi.getActive();
      setActive(r.data.data);
      if (r.data.data.length > 0) {
        setDuration(r.data.data[0].duracion_min_config || 30);
      }
    } catch (err) {
      console.error('Error cargando sesiones', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      lactationApi.getActive().then(r => r.data.data),
      salonesApi.list({ tipo: 'LACTANCIA', activo: true }).then(r => r.data.data),
    ]).then(([sessions, sal]) => {
      setActive(sessions);
      setSalones(sal);
      if (sal[0]) setForm(f => ({ ...f, salon_id: sal[0].id }));
      if (sessions[0]) {
        setDuration(sessions[0].duracion_min_config || 30);
      }
    }).finally(() => setLoading(false));

    // Refrescar cada 30s para mantener cronómetros sincronizados con el servidor
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  // === CHECK-IN ===
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await lactationApi.checkIn(form);
      toast.success(`Sesión registrada: ${r.data.data.ticket}`);
      setCheckInModal(false);
      setForm({ nombre_madre: '', nombre_bebe: '', salon_id: salones[0]?.id || '' });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error al registrar');
    } finally {
      setSubmitting(false);
    }
  };

  // === CHECK-OUT (con fix de doble clic) ===
  const handleCheckOut = async (id) => {
    if (processingId) return; // bloquea clics adicionales mientras procesa
    setProcessingId(id);
    try {
      await lactationApi.checkOut(id);
      // Optimistic update: removemos la sesión inmediatamente del estado
      setActive(prev => prev.filter(s => s.id !== id));
      toast.success('Sesión finalizada');
      // Refrescamos en segundo plano para confirmar
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error al finalizar');
      // Si falló, recargamos para volver al estado real
      await load();
    } finally {
      setProcessingId(null);
    }
  };

  // === UPDATE ===
  const openEdit = (session) => {
    setEditingSession(session);
    setEditForm({
      nombre_madre: session.nombre_madre || '',
      nombre_bebe: session.nombre_bebe || '',
      observaciones: session.observaciones || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await lactationApi.update(editingSession.id, editForm);
      toast.success('Sesión actualizada');
      setEditingSession(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  // === DELETE ===
  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar la sesión de ${nombre}? Esta acción es permanente.`)) return;
    if (processingId) return;
    setProcessingId(id);
    try {
      await lactationApi.remove(id);
      setActive(prev => prev.filter(s => s.id !== id));
      toast.success('Sesión eliminada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
      await load();
    } finally {
      setProcessingId(null);
    }
  };

  // === HISTORIAL ===
  const openHistory = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const r = await lactationApi.history({ from: today, limit: 50 });
      setHistoryData(r.data.data);
      setHistoryOpen(true);
    } catch (err) {
      toast.error('No se pudo cargar el historial');
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Baby className="text-green-600" /> Espacio de Lactancia
          </h1>
          <p className="text-slate-500">
            {active.length}/{maxConcurrent} sesiones activas · Duración configurada: {duration} min
          </p>
        </div>
        <div className="flex gap-2">
          {canViewHistory && (
            <button onClick={openHistory} className="btn-ghost">
              <History size={16} className="inline mr-1" /> Historial
            </button>
          )}
          {canCreate && (
            <button onClick={() => setCheckInModal(true)} className="btn-primary"
                    disabled={active.length >= maxConcurrent}>
              <Plus size={16} className="inline mr-1" /> Nueva sesión
            </button>
          )}
        </div>
      </div>

      {/* Grid de sesiones activas */}
      {active.length === 0 ? (
        <div className="card text-center py-16">
          <Baby size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No hay sesiones activas</p>
          {canCreate && (
            <button onClick={() => setCheckInModal(true)} className="btn-primary mt-4">
              <Plus size={16} className="inline mr-1" /> Registrar primera sesión
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map(s => {
            const salonName = salones.find(x => x.id === s.salon_id)?.nombre || s.salon_id;
            const isProcessing = processingId === s.id;
            return (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-mono text-xs text-slate-500">{s.ticket}</p>
                    <h3 className="font-bold text-slate-900 mt-1">{s.nombre_madre}</h3>
                    {s.nombre_bebe && <p className="text-xs text-slate-500">Bebé: {s.nombre_bebe}</p>}
                    <p className="text-xs text-slate-500 mt-1">{salonName}</p>
                  </div>
                  <div className="text-right">
                    <Clock size={14} className="inline text-slate-400 mr-1" />
                    <CountdownTimer initialSeconds={s.tiempo_restante_segundos} />
                  </div>
                </div>
                {s.observaciones && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mb-2">
                    {s.observaciones}
                  </p>
                )}
                <div className="flex gap-1 pt-3 border-t">
                  {canEnd && (
                    <button
                      onClick={() => handleCheckOut(s.id)}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded font-medium text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Exit size={14} className="inline mr-1" />
                      {isProcessing ? 'Finalizando...' : 'Finalizar'}
                    </button>
                  )}
                  {canUpdate && (
                    <button onClick={() => openEdit(s)} disabled={isProcessing}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50" title="Editar">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(s.id, s.nombre_madre)} disabled={isProcessing}
                            className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded disabled:opacity-50"
                            title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Check-in */}
      <Modal open={checkInModal} onClose={() => setCheckInModal(false)} title="Registrar nueva sesión">
        <form onSubmit={handleCheckIn} className="space-y-3">
          <div>
            <label className="label">Nombre de la madre *</label>
            <input className="input" required autoFocus value={form.nombre_madre}
              onChange={(e) => setForm({ ...form, nombre_madre: e.target.value })} />
          </div>
          <div>
            <label className="label">Nombre del bebé (opcional)</label>
            <input className="input" value={form.nombre_bebe}
              onChange={(e) => setForm({ ...form, nombre_bebe: e.target.value })} />
          </div>
          <div>
            <label className="label">Salón *</label>
            <select className="input" required value={form.salon_id}
              onChange={(e) => setForm({ ...form, salon_id: e.target.value })}>
              <option value="">Selecciona...</option>
              {salones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
            La sesión tendrá una duración máxima de <strong>{duration} minutos</strong>.
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setCheckInModal(false)} className="btn-ghost flex-1" disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Editar sesión */}
      <Modal open={!!editingSession} onClose={() => setEditingSession(null)} title="Editar sesión">
        {editingSession && (
          <form onSubmit={handleUpdate} className="space-y-3">
            <p className="text-xs text-slate-500 font-mono">{editingSession.ticket}</p>
            <div>
              <label className="label">Nombre de la madre *</label>
              <input className="input" required value={editForm.nombre_madre}
                onChange={(e) => setEditForm({ ...editForm, nombre_madre: e.target.value })} />
            </div>
            <div>
              <label className="label">Nombre del bebé</label>
              <input className="input" value={editForm.nombre_bebe}
                onChange={(e) => setEditForm({ ...editForm, nombre_bebe: e.target.value })} />
            </div>
            <div>
              <label className="label">Observaciones</label>
              <textarea className="input" rows="2" value={editForm.observaciones}
                onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingSession(null)} className="btn-ghost flex-1" disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: Historial */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Historial del día" size="lg">
        <div className="max-h-96 overflow-y-auto">
          {historyData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Sin sesiones hoy</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Ticket</th>
                  <th className="text-left p-2">Madre</th>
                  <th className="text-left p-2">Ingreso</th>
                  <th className="text-left p-2">Salida</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map(h => (
                  <tr key={h.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{h.ticket}</td>
                    <td className="p-2">{h.nombre_madre}</td>
                    <td className="p-2 text-xs">{h.hora_ingreso?.slice(11, 16)}</td>
                    <td className="p-2 text-xs">{h.hora_salida_real?.slice(11, 16) || '-'}</td>
                    <td className="p-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{h.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}
