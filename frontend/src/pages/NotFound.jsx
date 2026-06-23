import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-muni-primary mb-2">404</h1>
        <p className="text-xl text-slate-700 mb-6">Página no encontrada</p>
        <Link to="/dashboard" className="btn-primary">Volver al inicio</Link>
      </div>
    </div>
  );
}
