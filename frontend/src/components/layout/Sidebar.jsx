import { NavLink } from 'react-router-dom';
import { Home, Baby, Calendar, Users, Shield, LogOut, Settings, KeyRound, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import escudo from '../../assets/escudo.png';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home, permission: 'dashboard:read' },
  { path: '/lactation', label: 'Lactancia', icon: Baby, permission: 'lactation:create' },
  { path: '/reservations', label: 'Reservas', icon: Calendar, permission: 'reservation:read:own' },
  { path: '/salones', label: 'Salones', icon: MapPin, permission: 'salones:read' },
  { path: '/users', label: 'Usuarios', icon: Users, permission: 'users:read' },
  { path: '/permissions', label: 'Permisos', icon: KeyRound, permission: 'permissions:manage' },
  { path: '/email-templates', label: 'Plantillas Email', icon: Mail, permission: 'email_templates:read' },
  { path: '/settings', label: 'Configuración', icon: Settings, permission: 'settings:read' },
  { path: '/audit', label: 'Auditoría', icon: Shield, permission: 'audit:read' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();
  const visible = menuItems.filter(i => hasPermission(i.permission));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <img src={escudo} alt="Escudo Muniguate" className="w-10 h-auto" />
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">Salones DAV</h1>
            <p className="text-xs text-slate-500">Muniguate</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visible.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-muni-primary text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }>
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-slate-900 truncate">{user?.nombre_completo}</p>
          <p className="text-xs text-slate-500">{user?.rol}</p>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
