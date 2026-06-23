import { useEffect, useState } from 'react';
import * as auditApi from '../api/auditApi';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ accion: '', usuario_id: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await auditApi.list({ ...filters, limit: 200 });
      setLogs(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: r => <span className="text-xs font-mono">{new Date(r.timestamp).toLocaleString('es-GT')}</span> },
    { key: 'usuario_email', label: 'Usuario' },
    { key: 'accion', label: 'Acción', render: r => <span className="badge badge-info">{r.accion}</span> },
    { key: 'recurso', label: 'Recurso' },
    { key: 'metodo_http', label: 'Método' },
    { key: 'status_code', label: 'HTTP', render: r => {
      const code = parseInt(r.status_code || '0', 10);
      const cls = code >= 400 ? 'badge-danger' : code >= 300 ? 'badge-warning' : 'badge-success';
      return <span className={cls}>{r.status_code || '-'}</span>;
    } },
    { key: 'ip', label: 'IP', render: r => <span className="text-xs font-mono">{r.ip}</span> },
    { key: 'resultado', label: 'Resultado', render: r =>
        <span className={r.resultado === 'EXITO' ? 'badge-success' : 'badge-danger'}>{r.resultado}</span>
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Auditoría</h1>
      <p className="text-slate-500 mb-6">Registro de operaciones del sistema</p>

      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Filtrar por acción"
            value={filters.accion} onChange={(e) => setFilters({ ...filters, accion: e.target.value })} />
          <input className="input" placeholder="ID de usuario"
            value={filters.usuario_id} onChange={(e) => setFilters({ ...filters, usuario_id: e.target.value })} />
          <button onClick={load} className="btn-primary">Aplicar filtros</button>
        </div>
      </div>

      {loading ? <Spinner size="lg" /> : <Table columns={columns} data={logs} emptyMessage="Sin logs" />}
    </div>
  );
}
