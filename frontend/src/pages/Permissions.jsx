import { useEffect, useState } from 'react';
import { Shield, User, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../api/usersApi';
import * as permissionsApi from '../api/permissionsApi';
import Spinner from '../components/common/Spinner';

export default function Permissions() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detail, setDetail] = useState(null);
  const [editedPerms, setEditedPerms] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.list()
      .then(r => setUsers(r.data.data.filter(u => u.activo === 'TRUE' || u.activo === true)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUserId) { setDetail(null); return; }
    setLoadingDetail(true);
    permissionsApi.getUserPermissions(selectedUserId)
      .then(r => {
        setDetail(r.data.data);
        const initial = {};
        r.data.data.detail.forEach(m => m.permisos.forEach(p => { initial[p.code] = p.efectivo; }));
        setEditedPerms(initial);
      })
      .catch(err => toast.error(err.response?.data?.error?.message || 'Error'))
      .finally(() => setLoadingDetail(false));
  }, [selectedUserId]);

  const togglePerm = (code) => {
    setEditedPerms(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleModule = (modulo, value) => {
    setEditedPerms(prev => {
      const updated = { ...prev };
      modulo.permisos.forEach(p => { updated[p.code] = value; });
      return updated;
    });
  };

  const resetToRole = () => {
    if (!detail) return;
    const reset = {};
    detail.detail.forEach(m => m.permisos.forEach(p => { reset[p.code] = p.inBase; }));
    setEditedPerms(reset);
    toast('Restaurado a permisos del rol base. Recuerda guardar.', { icon: '🔄' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selections = Object.entries(editedPerms).map(([code, efectivo]) => ({ code, efectivo }));
      const r = await permissionsApi.updateUserPermissions(selectedUserId, selections);
      setDetail(r.data.data);
      toast.success('Permisos actualizados. Los cambios aplicarán al próximo refresh del usuario.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const hasChanges = detail && detail.detail.some(m =>
    m.permisos.some(p => editedPerms[p.code] !== p.efectivo));

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
        <Shield className="text-muni-primary" /> Permisos
      </h1>
      <p className="text-slate-500 mb-6">Asigna permisos personalizados a cada usuario sobre el rol base</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de usuarios */}
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Usuarios activos</h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                  selectedUserId === u.id ? 'bg-muni-primary text-white' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.nombre_completo}</p>
                    <p className={`text-xs truncate ${selectedUserId === u.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {u.email} · {u.rol}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel de permisos */}
        <div className="lg:col-span-3">
          {!selectedUserId ? (
            <div className="card text-center py-16 text-slate-500">
              <Shield size={48} className="mx-auto text-slate-300 mb-3" />
              <p>Selecciona un usuario para editar sus permisos</p>
            </div>
          ) : loadingDetail ? (
            <Spinner size="lg" />
          ) : detail && (
            <div>
              <div className="card mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-bold text-lg">{detail.user.nombre_completo}</h2>
                    <p className="text-sm text-slate-500">
                      {detail.user.email} · Rol base: <span className="font-medium text-muni-primary">{detail.user.rol}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={resetToRole} className="btn-ghost text-sm" disabled={saving}>
                      <RotateCcw size={14} className="inline mr-1" />
                      Restaurar al rol
                    </button>
                    <button onClick={handleSave} disabled={!hasChanges || saving} className="btn-primary text-sm">
                      <Save size={14} className="inline mr-1" />
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
                {hasChanges && (
                  <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    Hay cambios sin guardar
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {detail.detail.map(modulo => {
                  const moduleAllOn = modulo.permisos.every(p => editedPerms[p.code]);
                  const moduleAllOff = modulo.permisos.every(p => !editedPerms[p.code]);
                  return (
                    <div key={modulo.modulo} className="card">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b">
                        <h3 className="font-semibold text-slate-800">{modulo.modulo}</h3>
                        <div className="flex gap-1 text-xs">
                          <button onClick={() => toggleModule(modulo, true)}
                                  disabled={moduleAllOn}
                                  className="px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40">
                            Todos
                          </button>
                          <button onClick={() => toggleModule(modulo, false)}
                                  disabled={moduleAllOff}
                                  className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40">
                            Ninguno
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {modulo.permisos.map(perm => {
                          const current = editedPerms[perm.code];
                          const isOverride = current !== perm.inBase;
                          const overrideType = current && !perm.inBase ? 'GRANT' : !current && perm.inBase ? 'REVOKE' : null;
                          return (
                            <label key={perm.code}
                                   className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                     isOverride ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                                   }`}>
                              <input type="checkbox" checked={current} onChange={() => togglePerm(perm.code)}
                                     className="w-4 h-4 text-muni-primary rounded focus:ring-2 focus:ring-muni-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{perm.label}</p>
                                <p className="text-[10px] font-mono text-slate-500 truncate">{perm.code}</p>
                              </div>
                              {overrideType && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  overrideType === 'GRANT' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                }`}>
                                  {overrideType === 'GRANT' ? '+' : '-'}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card mt-4 bg-slate-50 text-xs text-slate-600">
                <p className="font-semibold mb-1">📖 Cómo leer esta vista:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><span className="font-bold text-green-700">+</span> = permiso adicional otorgado (no viene en el rol)</li>
                  <li><span className="font-bold text-red-700">-</span> = permiso quitado (viene en el rol pero fue revocado)</li>
                  <li>Sin marca = el permiso coincide con el rol base</li>
                  <li>Los cambios aplican cuando el usuario hace login o actualiza la página</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
