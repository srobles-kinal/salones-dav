import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Mail, Baby, Save, TestTube2, Key } from 'lucide-react';
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
    !k.startsWith('_') && edited[k] !== config[k]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      Object.keys(edited).forEach(k => {
        if (!k.startsWith('_') && edited[k] !== config[k]) updates[k] = edited[k];
      });
      if (updates.SMTP_PASS === '****') delete updates.SMTP_PASS;
      if (updates.BREVO_API_KEY === '****') delete updates.BREVO_API_KEY;

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
      const result = r.data.data;
      if (result.ok) toast.success(result.message, { duration: 6000 });
      else toast.error(`${result.message}${result.hint ? '\n💡 ' + result.hint : ''}`, { duration: 8000 });
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

      {/* Email vía Brevo */}
      <div className="card mb-4">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b">
          <Mail size={18} className="text-blue-600" /> Notificaciones por correo (Brevo)
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900 mb-4">
          <strong>📌 Importante:</strong> El sistema usa <strong>Brevo</strong> (HTTP API) para enviar correos,
          ya que Render bloquea SMTP en el tier free desde sep/2025. Brevo es gratis hasta 300 correos/día.
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" disabled={!canUpdate}
              checked={!!edited.EMAIL_ENABLED}
              onChange={(e) => setField('EMAIL_ENABLED', e.target.checked)}
              className="w-4 h-4 text-muni-primary rounded" />
            <span className="text-sm font-medium">Habilitar envío de correos</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Correo remitente (FROM) *</label>
            <input type="email" className="input" disabled={!canUpdate}
              value={edited.EMAIL_FROM || ''}
              placeholder="no-reply@muniguate.gt"
              onChange={(e) => setField('EMAIL_FROM', e.target.value)} />
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Debe estar verificado como sender en Brevo (app.brevo.com → Senders).
            </p>
          </div>
          <div>
            <label className="label">Nombre del remitente</label>
            <input className="input" disabled={!canUpdate}
              value={edited.EMAIL_FROM_NAME || ''}
              placeholder="Sistema de Salones DAV"
              onChange={(e) => setField('EMAIL_FROM_NAME', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label flex items-center gap-1">
              <Key size={14} /> Brevo API Key *
            </label>
            <input type="password" className="input font-mono" disabled={!canUpdate}
              value={edited.BREVO_API_KEY || ''}
              placeholder={config?._BREVO_API_KEY_SET ? '**** (deja vacío para mantener actual)' : 'xkeysib-...'}
              onChange={(e) => setField('BREVO_API_KEY', e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">
              Genera la API key en{' '}
              <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer"
                 className="text-muni-primary underline">app.brevo.com → SMTP & API</a>.
              Empieza con <code className="bg-slate-100 px-1 rounded">xkeysib-</code>.
            </p>
          </div>
        </div>

        {canUpdate && (
          <div className="mt-4 pt-4 border-t">
            <button onClick={handleTestEmail} disabled={testing} className="btn-ghost text-sm">
              <TestTube2 size={14} className="inline mr-1" />
              {testing ? 'Probando...' : 'Probar conexión con Brevo'}
            </button>
            <p className="text-xs text-slate-500 mt-1">
              Verifica que la API key sea válida y muestra créditos disponibles.
            </p>
          </div>
        )}
      </div>

      {/* Guía Brevo */}
      <div className="card bg-green-50 border-green-200 mb-4">
        <h3 className="font-semibold text-green-900 text-sm mb-2">📧 Pasos para configurar Brevo</h3>
        <ol className="text-xs text-green-900 space-y-1.5 list-decimal list-inside">
          <li>Crea cuenta gratis en <a href="https://www.brevo.com" target="_blank" rel="noreferrer" className="underline">brevo.com</a> (300 correos/día gratis).</li>
          <li>Verifica el correo remitente en Brevo → <strong>Senders</strong> → Add a sender → te llega un email → click en "Verify".</li>
          <li>Genera API key: Brevo → <strong>SMTP & API</strong> → <strong>Generate a new API key</strong> → copia el valor (xkeysib-...).</li>
          <li>Pega la API key aquí arriba, marca "Habilitar envío", pulsa <strong>Guardar cambios</strong>.</li>
          <li>Pulsa <strong>Probar conexión con Brevo</strong>. Debe decir "Conexión Brevo exitosa".</li>
        </ol>
      </div>
    </div>
  );
}
