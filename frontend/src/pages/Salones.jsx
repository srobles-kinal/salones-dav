import { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, RotateCcw, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import * as salonesApi from '../api/salonesApi';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { usePermission } from '../hooks/usePermission';

const TIPOS = [
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'LACTANCIA', label: 'Lactancia' },
];

const emptyForm = { nombre: '', tipo: 'CAPACITACION', capacidad: 10, ubicacion: '', descripcion: '' };

export default function Salones() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('salones:create');
  const canUpdate = hasPermission('salones:update');
  const canDelete = hasPermission('salones:delete');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterTipo, setFilterTipo] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const load = async () => {
    try {
      const params = {};
      if (filterTipo) params.tipo = filterTipo;
      const r = await salonesApi.list(params);
      let data = r.data.data;
      if (!showInactive) data = data.filter(s => s.activo === 'TRUE' || s.activo === true);
      setItems(data);
    } catch (err) {
      toast.error('Error cargando salones');
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!loading) load(); }, [filterTipo, showInactive]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || '',
      tipo: item.tipo || 'CAPACITACION',
      capacidad: parseInt(item.capacidad, 10) || 1,
      ubicacion: item.ubicacion || '',
      descripcion: item.descripcion || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editing) {
        await salonesApi.update(editing.id, {
          ...form, capacidad: parseInt(form.capacidad, 10),
        });
        toast.success('Salón actualizado');
      } else {
        await salonesApi.create({ ...form, capacidad: parseInt(form.capacidad, 10) });
        toast.success('Salón creado');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Desactivar el salón "${item.nombre}"? Quedará oculto pero conservará el historial.`)) return;
    try {
      await salonesApi.remove(item.id);
      toast.success('Salón desactivado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleRestore = async (item) => {
    try {
      await salonesApi.restore(item.id);
      toast.success('Salón reactivado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-muni-primary" /> Salones
          </h1>
          <p className="text-slate-500">{items.length} salones</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> Nuevo salón
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-4 flex flex-wrap gap-3 items-center">
        <select className="input max-w-xs" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
                 className="w-4 h-4 text-muni-primary rounded" />
          Mostrar inactivos
        </label>
      </div>

      {/* Grid de salones */}
      {items.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
          <p>Sin salones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(s => {
            const isActive = s.activo === 'TRUE' || s.activo === true;
            return (
              <div key={s.id} className={`card ${!isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{s.nombre}</h3>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                      s.tipo === 'LACTANCIA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.tipo === 'LACTANCIA' ? '🤱 Lactancia' : '📚 Capacitación'}
                    </span>
                  </div>
                  {!isActive && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">Inactivo</span>
                  )}
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    Capacidad: <strong>{s.capacidad}</strong>
                  </div>
                  {s.ubicacion && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      {s.ubicacion}
                    </div>
                  )}
                  {s.descripcion && (
                    <p className="text-xs text-slate-500 mt-2">{s.descripcion}</p>
                  )}
                </div>
                {(canUpdate || canDelete) && (
                  <div className="flex gap-1 pt-3 border-t">
                    {canUpdate && (
                      <button onClick={() => openEdit(s)} className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded font-medium text-sm">
                        <Edit2 size={14} className="inline mr-1" /> Editar
                      </button>
                    )}
                    {canDelete && isActive && (
                      <button onClick={() => handleDelete(s)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Desactivar">
                        <Trash2 size={14} />
                      </button>
                    )}
                    {canUpdate && !isActive && (
                      <button onClick={() => handleRestore(s)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Reactivar">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear/Editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
             title={editing ? `Editar: ${editing.nombre}` : 'Nuevo salón'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" required autoFocus value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo *</label>
              <select className="input" required value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Capacidad *</label>
              <input type="number" min="1" max="1000" className="input" required value={form.capacidad}
                onChange={(e) => setForm({ ...form, capacidad: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Ubicación</label>
            <input className="input" placeholder="Ej: 2do piso, Edificio Municipal"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows="2" value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1" disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear salón'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
