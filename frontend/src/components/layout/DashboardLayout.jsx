import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Botón hamburguesa: solo móvil */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-white rounded-lg shadow border border-slate-200"
        aria-label="Abrir menú"
      >
        <Menu size={22} className="text-slate-700" />
      </button>

      {/* Overlay oscuro en móvil cuando el sidebar está abierto */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <div className="flex">
        {/* Sidebar: fijo en desktop, deslizante en móvil */}
        <div
          className={`fixed lg:sticky top-0 z-50 h-screen transition-transform duration-300 lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="relative h-full">
            {/* Botón cerrar dentro del sidebar en móvil */}
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden absolute top-3 right-3 z-10 p-1.5 hover:bg-slate-100 rounded"
              aria-label="Cerrar menú"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0 p-4 pt-16 lg:p-8 lg:pt-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
