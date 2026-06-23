import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import * as permissionsApi from '../api/permissionsApi';
import { setAccessToken, setUnauthorizedHandler } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    setAccessToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setUser(null);
      navigate('/login');
    });
  }, [navigate]);

  const loadUserWithPermissions = async () => {
    const meRes = await authApi.me();
    const baseUser = meRes.data.data.user;
    // Cargar permisos efectivos
    try {
      const permsRes = await permissionsApi.me();
      baseUser.permissions = permsRes.data.data.permissions;
    } catch {
      baseUser.permissions = [];
    }
    return baseUser;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const r = await authApi.refresh();
        setAccessToken(r.data.data.accessToken);
        const fullUser = await loadUserWithPermissions();
        setUser(fullUser);
      } catch { setUser(null); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const r = await authApi.login(email, password);
    const { accessToken } = r.data.data;
    setAccessToken(accessToken);
    const fullUser = await loadUserWithPermissions();
    setUser(fullUser);
    return fullUser;
  };

  // Función para refrescar permisos sin recargar la sesión (útil tras editar permisos propios)
  const refreshPermissions = useCallback(async () => {
    if (!user) return;
    try {
      const permsRes = await permissionsApi.me();
      setUser(prev => ({ ...prev, permissions: permsRes.data.data.permissions }));
    } catch {}
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
