import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import escudo from '../assets/escudo.png';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al iniciar sesión';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muni-primary to-blue-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <img src={escudo} alt="Escudo Municipalidad de Guatemala"
               className="w-20 h-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Salones DAV</h1>
          <p className="text-slate-500 mt-1">Atención al Vecino · Muniguate</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Correo institucional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10" placeholder="usuario@muniguate.gt" autoComplete="email" />
            </div>
          </div>

          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10" placeholder="••••••••" autoComplete="current-password" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Sistema institucional · Acceso restringido
        </p>
      </div>
    </div>
  );
}
