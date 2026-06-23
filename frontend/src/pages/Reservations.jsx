import { useEffect, useState } from 'react';
import { Calendar, Plus, Check, X, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as reservationsApi from '../api/reservationsApi';
import * as salonesApi from '../api/salonesApi';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import StateBadge from '../components/common/StateBadge';
import Spinner from '../components/common/Spinner';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  solicitante_nombre: '', solicitante_email: '', solicitante_telefono: '',
  departamento: '', cantidad_participantes: 1, tema: '', descripcion: '',
  salon_id: '', fecha: '', hora_inicio: '', hora_fin: '',
};

export default function Reservations() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('reservation:create');
  const canApprove = hasPermission('reservation:approve');
  const canReject = hasPermission('reservation:reject');
  const canUpdateAny = hasPermission('reservation:update:any');
  const canUpdateOwn = hasPermission('reservation:update:own');
  const canCancelAny = hasPermission('reservation:cancel:any');
  const canCancelOwn = hasPermission('reservation:cancel:own');

  const [items, setItems] = useState([]);
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const params = filterEstado ? { estado: filterEstado } : {};
      const r = await reservationsApi.list(params);
      setItems(r.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    Promise.all([reservationsApi.list(), salonesApi.list()])
      .then(([r, s]) => {
        setItems(r.data.data);
        const cap = s.data.data.filter(x => x.tipo === 'CAPACITACION');
        setSalones(cap);
        if (cap[0]) setForm(f => ({ ...f, salon_id: cap[0].id }));
      }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!loading) load(); }, [filterEstado]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, salon_id: salones[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      solicitante_nombre: item.solicitante_nombre || '',
      solicitante_email: item.solicitante_email || '',
      solicitante_telefono: item.solicitante_telefono || '',
      departamento: item.departamento || '',
      cantidad_participantes: parseInt(item.cantidad_participantes, 10) || 1,
      tema: item.tema || '',
      descripcion: item.descripcion || '',
      salon_id: item.salon_id || '',
      fecha: item.fecha || '',
      hora_inicio: item.hora_inicio || '',
      hora_fin: item.hora_fin || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await reservationsApi.update(editing.id, {
          ...form,
          cantidad_participantes: parseInt(form.cantidad_participantes, 10),
        });
        toast.success('Reserva actualizada');
      } else {
        const r = await reservationsApi.create({
          ...form,
          cantidad_participantes: parseInt(form.cantidad_participantes, 10),
        });
        toast.success(`Solicitud creada: ${r.data.data.codigo}`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleApprove = async (id) => {
    try { await reservationsApi.approve(id); toast.success('Reserva aprobada (notificando al solicitante)'); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Error'); }
  };

  const handleReject = async (id) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    try { await reservationsApi.reject(id, motivo); toast.success('Reserva rechazada (notificando al solicitante)'); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Error'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try { await reservationsApi.cancel(id); toast.success('Reserva cancelada'); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Error'); }
  };

  const salonName = (id) => salones.find(s => s.id === id)?.nombre || '-';

  const canEditRow = (item) =>
    item.estado === 'PENDIENTE' && (canUpdateAny || (canUpdateOwn && item.creado_por === user?.id));

  const canCancelRow = (item) =>
    !['CANCELADA', 'COMPLETADA'].includes(item.estado) &&
    (canCancelAny || (canCancelOwn && item.creado_por === user?.id));

  const columns = [
    { key: 'codigo', label: 'Código', render: r => <span className="font-mono text-xs">{r.codigo}</span> },
    { key: 'solicitante_nombre', label: 'Solicitante' },
    { key: 'tema', label: 'Tema' },
    { key: 'salon_id', label: 'Salón', render: r => salonName(r.salon_id) },
    { key: 'fecha', label: 'Fecha', render: r => `${r.fecha} ${r.hora_inicio}-${r.hora_fin}` },
    { key: 'estado', label: 'Estado', render: r => <StateBadge value={r.estado} /> },
    {
      key: 'acciones', label: 'Acciones',
      render: r => (
        <div className="flex gap-1">
          {canApprove && r.estado === 'PENDIENTE' && (
            <button onClick={() => handleApprove(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Aprobar">
              <Check size={16} />
            </button>
          )}
          {canReject && r.estado === 'PENDIENTE' && (
            <button onClick={() => handleReject(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Rechazar">
              <X size={16} />
            </button>
          )}
          {canEditRow(r) && (
            <button onClick={() => openEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
              <Edit2 size={16} />
            </button>
          )}
          {canCancelRow(r) && (
            <button onClick={() => handleCancel(r.id)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Cancelar">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas de Capacitación</h1>
          <p className="text-slate-500">{items.length} reservas</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={18} className="inline mr-1" /> Nueva reserva
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <select className="input max-w-xs" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADA">Aprobada</option>
          <option value="RECHAZADA">Rechazada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      <Table columns={columns} data={items} emptyMessage="Sin reservas" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
             title={editing ? `Editar reserva ${editing.codigo}` : 'Nueva reserva'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nombre del solicitante *</label>
            <input className="input" required value={form.solicitante_nombre}
              onChange={(e) => setForm({ ...form, solicitante_nombre: e.target.value })} />
          </div>
          <div>
            <label className="label">Email (recibe notificaciones)</label>
            <input type="email" className="input" value={form.solicitante_email}
              onChange={(e) => setForm({ ...form, solicitante_email: e.target.value })} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" value={form.solicitante_telefono}
              onChange={(e) => setForm({ ...form, solicitante_telefono: e.target.value })} />
          </div>
          <div>
            <label className="label">Departamento *</label>
            <input className="input" required value={form.departamento}
              onChange={(e) => setForm({ ...form, departamento: e.target.value })} />
          </div>
          <div>
            <label className="label">Participantes *</label>
            <input type="number" min="1" max="500" className="input" required value={form.cantidad_participantes}
              onChange={(e) => setForm({ ...form, cantidad_participantes: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Tema *</label>
            <input className="input" required value={form.tema}
              onChange={(e) => setForm({ ...form, tema: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input" rows="2" value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div>
            <label className="label">Salón *</label>
            <select className="input" required value={form.salon_id}
              onChange={(e) => setForm({ ...form, salon_id: e.target.value })}>
              {salones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha *</label>
            <input type="date" className="input" required value={form.fecha}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <div>
            <label className="label">Hora inicio *</label>
            <input type="time" className="input" required value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} />
          </div>
          <div>
            <label className="label">Hora fin *</label>
            <input type="time" className="input" required value={form.hora_fin}
              onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">
              {editing ? 'Guardar cambios' : 'Crear solicitud'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
