import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Mail, Baby, Save, TestTube2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as settingsApi from '../api/settingsApi';
import Spinner from '../components/common/Spinner';
import { usePermission } from '../hooks/usePermission';

export default function Settings() {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission('settings:update');

  const [config, setConfig] = useState(null);
  const [edited, setEdited] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    settingsApi.get()
      .then(r => { setConfig(r.data.data); setEdited(r.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const setField = (key, value) => setEdited(prev => ({ ...prev, [key]: value }));

  const hasChanges = config && Object.keys(edited).some(k =>
    k !== '_SMTP_PASS_SET' && edited[k] !== config[k]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Solo enviar los campos que cambiaron
      const updates = {};
      Object.keys(edited).forEach(k => {
        if (k !== '_SMTP_PASS_SET' && edited[k] !== config[k]) updates[k] = edited[k];
      });
      // Si SMTP_PASS sigue siendo '****' no se envía
      if (updates.SMTP_PASS === '****') delete updates.SMTP_PASS;

      const r = await settingsApi.update(updates);
      setConfig(r.data.data); setEdited(r.data.data);
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const r = await settingsApi.testEmail();
      if (r.data.data.ok) toast.success(r.data.data.message);
      else toast.error(r.data.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally { setTesting(false); }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="text-muni-primary" /> Configuración
          </h1>
          <p className="text-slate-500">Parámetros globales del sistema</p>
        </div>
        {canUpdate && (
          <button onClick={handleSave} disabled={!hasChanges || saving} className="btn-primary">
            <Save size={16} className="inline mr-1" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {!canUpdate && (
        <div className="card mb-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">Tienes acceso de solo lectura a esta sección.</p>
        </div>
      )}

      {/* Lactancia */}
      <div className="card mb-4">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b">
          <Baby size={18} className="text-green-600" /> Espacio de lactancia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Duración máxima por sesión (minutos)</label>
            <input type="number" min="5" max="180" className="input" disabled={!canUpdate}
              value={edited.LACTATION_DURATION_MIN ?? 30}
              onChange={(e) => setField('LACTATION_DURATION_MIN', parseInt(e.target.value, 10))} />
            <p className="text-xs text-slate-500 mt-1">Entre 5 y 180 minutos. Por defecto: 30.</p>
          </div>
          <div>
            <label className="label">Capacidad simultánea</label>
            <input type="number" min="1" max="20" className="input" disabled={!canUpdate}
              value={edited.LACTATION_MAX_CONCURRENT ?? 3}
              onChange={(e) => setField('LACTATION_MAX_CONCURRENT', parseInt(e.target.value, 10))} />
            <p className="text-xs text-slate-500 mt-1">Madres atendidas a la vez. Por defecto: 3.</p>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="card mb-4">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b">
          <Mail size={18} className="text-blue-600" /> Notificaciones por correo
        </h2>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" disabled={!canUpdate}
              checked={!!edited.EMAIL_ENABLED}
              onChange={(e) => setField('EMAIL_ENABLED', e.target.checked)}
              className="w-4 h-4 text-muni-primary rounded" />
            <span className="text-sm font-medium">Habilitar envío de correos</span>
          </label>
          <p className="text-xs text-slate-500 mt-1 ml-6">
            Cuando esté activo, se enviarán correos al solicitante en cada cambio de estado de la reserva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Correo remitente (FROM)</label>
            <input type="email" className="input" disabled={!canUpdate}
              value={edited.EMAIL_FROM || ''}
              placeholder="no-reply@muniguate.gt"
              onChange={(e) => setField('EMAIL_FROM', e.target.value)} />
          </div>
          <div>
            <label className="label">Nombre del remitente</label>
            <input className="input" disabled={!canUpdate}
              value={edited.EMAIL_FROM_NAME || ''}
              placeholder="Sistema de Salones DAV"
              onChange={(e) => setField('EMAIL_FROM_NAME', e.target.value)} />
          </div>
          <div>
            <label className="label">Servidor SMTP (HOST)</label>
            <input className="input" disabled={!canUpdate}
              value={edited.SMTP_HOST || ''}
              placeholder="smtp.gmail.com / smtp.muniguate.gt"
              onChange={(e) => setField('SMTP_HOST', e.target.value)} />
          </div>
          <div>
            <label className="label">Puerto</label>
            <input type="number" className="input" disabled={!canUpdate}
              value={edited.SMTP_PORT || 587}
              onChange={(e) => setField('SMTP_PORT', parseInt(e.target.value, 10))} />
            <p className="text-xs text-slate-500 mt-1">587 (TLS) · 465 (SSL) · 25 (sin cifrado)</p>
          </div>
          <div>
            <label className="label">Usuario SMTP</label>
            <input className="input" disabled={!canUpdate}
              value={edited.SMTP_USER || ''}
              placeholder="usuario@dominio"
              onChange={(e) => setField('SMTP_USER', e.target.value)} />
          </div>
          <div>
            <label className="label">Contraseña SMTP</label>
            <input type="password" className="input" disabled={!canUpdate}
              value={edited.SMTP_PASS || ''}
              placeholder={config?._SMTP_PASS_SET ? 'Deja vacío para mantener actual' : 'Ingresa contraseña'}
              onChange={(e) => setField('SMTP_PASS', e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" disabled={!canUpdate}
                checked={!!edited.SMTP_SECURE}
                onChange={(e) => setField('SMTP_SECURE', e.target.checked)}
                className="w-4 h-4 text-muni-primary rounded" />
              <span className="text-sm">Conexión SSL (puerto 465)</span>
            </label>
          </div>
        </div>

        {canUpdate && (
          <div className="mt-4 pt-4 border-t">
            <button onClick={handleTestEmail} disabled={testing} className="btn-ghost text-sm">
              <TestTube2 size={14} className="inline mr-1" />
              {testing ? 'Probando...' : 'Probar conexión SMTP'}
            </button>
            <p className="text-xs text-slate-500 mt-1">
              Verifica que las credenciales sean correctas antes de habilitar el envío.
            </p>
          </div>
        )}
      </div>

      {/* Guía SMTP */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">📧 Guía rápida para configurar SMTP</h3>
        <div className="text-xs text-blue-900 space-y-2">
          <p><strong>Gmail:</strong> Host = smtp.gmail.com · Puerto 587 · Usar contraseña de aplicación (no la del usuario). Generar en myaccount.google.com/apppasswords.</p>
          <p><strong>Outlook / Office 365:</strong> Host = smtp.office365.com · Puerto 587 · SSL desactivado · Usuario es el email completo.</p>
          <p><strong>SendGrid:</strong> Host = smtp.sendgrid.net · Puerto 587 · Usuario = "apikey" · Contraseña = la API key generada.</p>
          <p><strong>Institucional muniguate.gt:</strong> Solicita al área de redes los datos de SMTP saliente.</p>
        </div>
      </div>
    </div>
  );
}
