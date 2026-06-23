import { useEffect, useState } from 'react';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../api/usersApi';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import { usePermission } from '../hooks/usePermission';

export default function Users() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('users:create');
  const canChangeRole = hasPermission('users:change_role');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', nombre_completo: '', rol: 'USR', departamento: '',
  });

  const load = async () => {
    try { const r = await usersApi.list(); setUsers(r.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await usersApi.create(form);
      toast.success('Usuario creado');
      setModalOpen(false);
      setForm({ email: '', password: '', nombre_completo: '', rol: 'USR', departamento: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      const newActivo = !(u.activo === true || u.activo === 'TRUE');
      await usersApi.setActive(u.id, newActivo);
      toast.success(newActivo ? 'Usuario activado' : 'Usuario desactivado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleChangeRole = async (u) => {
    const rol = prompt('Nuevo rol (SA, ADMIN, USR):', u.rol);
    if (!rol || !['SA', 'ADMIN', 'USR'].includes(rol)) return;
    try { await usersApi.changeRole(u.id, rol); toast.success('Rol actualizado'); load(); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Error'); }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'rol', label: 'Rol', render: r => <span className="badge badge-info">{r.rol}</span> },
    { key: 'departamento', label: 'Departamento' },
    {
      key: 'activo', label: 'Estado',
      render: r => {
        const isActive = r.activo === true || r.activo === 'TRUE';
        return <span className={isActive ? 'badge-success' : 'badge-neutral'}>{isActive ? 'Activo' : 'Inactivo'}</span>;
      }
    },
    {
      key: 'acciones', label: 'Acciones',
      render: r => (
        <div className="flex gap-1">
          <button onClick={() => handleToggleActive(r)} className="p-1.5 hover:bg-slate-100 rounded" title="Toggle activo">
            {(r.activo === true || r.activo === 'TRUE') ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-slate-400" />}
          </button>
          {canChangeRole && (
            <button onClick={() => handleChangeRole(r)} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">
              Rol
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
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500">{users.length} usuarios</p>
        </div>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={18} className="inline mr-1" /> Nuevo usuario
          </button>
        )}
      </div>

      <Table columns={columns} data={users} emptyMessage="Sin usuarios" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Contraseña * (mín 8 caracteres, mayúscula, minúscula, número)</label>
            <input type="password" className="input" required minLength="8" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input" required value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} />
          </div>
          <div>
            <label className="label">Rol *</label>
            <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="USR">USR - Usuario operativo</option>
              <option value="ADMIN">ADMIN - Administrador</option>
              <option value="SA">SA - Super Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Departamento</label>
            <input className="input" value={form.departamento}
              onChange={(e) => setForm({ ...form, departamento: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Crear</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
