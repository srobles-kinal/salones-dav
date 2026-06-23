import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md">
        <ShieldOff size={64} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Acceso denegado</h1>
        <p className="text-slate-600 mb-6">No tienes permisos para acceder a esta sección.</p>
        <Link to="/dashboard" className="btn-primary">Volver al dashboard</Link>
      </div>
    </div>
  );
}
