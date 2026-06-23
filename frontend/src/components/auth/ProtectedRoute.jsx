import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (permission) {
    const perms = user.permissions || [];
    if (!perms.includes(permission)) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
