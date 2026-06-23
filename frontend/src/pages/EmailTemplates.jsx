import { useEffect, useState } from 'react';
import { Mail, Save, RotateCcw, Eye, Send, Copy, Code, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import * as templatesApi from '../api/emailTemplatesApi';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { usePermission } from '../hooks/usePermission';

const ESTADO_BADGE = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

export default function EmailTemplates() {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission('email_templates:update');

  const [templates, setTemplates] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ asunto: '', html: '', texto: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState('html'); // 'html' | 'texto'
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    templatesApi.list().then(r => {
      setTemplates(r.data.data.templates);
      setVariables(r.data.data.variables);
    }).finally(() => setLoading(false));
  }, []);

  const selectTemplate = (tpl) => {
    setSelected(tpl);
    setForm({ asunto: tpl.asunto, html: tpl.html, texto: tpl.texto });
  };

  const hasChanges = selected && (
    form.asunto !== selected.asunto ||
    form.html !== selected.html ||
    form.texto !== selected.texto
  );

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const r = await templatesApi.update(selected.codigo, form);
      const updated = r.data.data;
      setSelected(updated);
      // Actualizar lista
      setTemplates(prev => prev.map(t => t.codigo === updated.codigo ? { ...t, ...updated } : t));
      toast.success('Plantilla guardada');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restaurar esta plantilla a su versión por defecto? Tu personalización se perderá.')) return;
    setSaving(true);
    try {
      const r = await templatesApi.reset(selected.codigo);
      const updated = r.data.data;
      setSelected(updated);
      setForm({ asunto: updated.asunto, html: updated.html, texto: updated.texto });
      setTemplates(prev => prev.map(t => t.codigo === updated.codigo ? { ...t, ...updated } : t));
      toast.success('Plantilla restaurada al valor por defecto');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      const r = await templatesApi.preview(form);
      setPreviewData(r.data.data);
      setPreviewOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Ingresa un email destinatario');
      return;
    }
    try {
      const r = await templatesApi.sendTest(selected.codigo, testEmail);
      if (r.data.data.ok) {
        toast.success(`Correo de prueba enviado a ${testEmail}`);
        setTestModalOpen(false);
      } else {
        toast.error(r.data.data.error || r.data.data.reason || 'Error');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    }
  };

  const insertVariable = (variable) => {
    const tag = `{{${variable}}}`;
    if (editorTab === 'html') {
      setForm({ ...form, html: form.html + ' ' + tag });
    } else {
      setForm({ ...form, texto: form.texto + ' ' + tag });
    }
    toast.success(`Variable insertada: ${tag}`);
  };

  const copyVariable = (variable) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Copiado: {{${variable}}}`);
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
        <Mail className="text-muni-primary" /> Plantillas de Correo
      </h1>
      <p className="text-slate-500 mb-6">
        Personaliza el contenido de los correos que se envían al solicitante según el estado de la reserva.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: lista de plantillas */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-semibold text-slate-700 mb-2 text-sm">Plantillas</h3>
          {templates.map(tpl => (
            <button key={tpl.codigo}
                    onClick={() => selectTemplate(tpl)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selected?.codigo === tpl.codigo
                        ? 'border-muni-primary bg-blue-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${ESTADO_BADGE[tpl.estado] || 'bg-slate-100'}`}>
                  {tpl.estado}
                </span>
                {tpl.customizado && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Personalizada</span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-800">{tpl.nombre}</p>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card text-center py-16 text-slate-500">
              <Mail size={48} className="mx-auto text-slate-300 mb-3" />
              <p>Selecciona una plantilla para editarla</p>
            </div>
          ) : (
            <>
              {/* Acciones */}
              <div className="card mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-bold text-lg">{selected.nombre}</h2>
                    <p className="text-xs text-slate-500">Código: <span className="font-mono">{selected.codigo}</span></p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handlePreview} className="btn-ghost text-sm">
                      <Eye size={14} className="inline mr-1" /> Vista previa
                    </button>
                    {canUpdate && (
                      <>
                        <button onClick={() => setTestModalOpen(true)} className="btn-ghost text-sm">
                          <Send size={14} className="inline mr-1" /> Enviar prueba
                        </button>
                        <button onClick={handleReset} className="btn-ghost text-sm text-red-600" disabled={saving}>
                          <RotateCcw size={14} className="inline mr-1" /> Restaurar default
                        </button>
                        <button onClick={handleSave} disabled={!hasChanges || saving} className="btn-primary text-sm">
                          <Save size={14} className="inline mr-1" />
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {hasChanges && (
                  <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    Hay cambios sin guardar
                  </div>
                )}
              </div>

              {/* Asunto */}
              <div className="card mb-4">
                <label className="label">Asunto del correo *</label>
                <input className="input font-medium" disabled={!canUpdate}
                  value={form.asunto}
                  onChange={(e) => setForm({ ...form, asunto: e.target.value })} />
                <p className="text-xs text-slate-500 mt-1">
                  Puedes usar variables como <code className="bg-slate-100 px-1 rounded">{'{{codigo}}'}</code> en el asunto.
                </p>
              </div>

              {/* Tabs editor */}
              <div className="card mb-4">
                <div className="flex border-b mb-3">
                  <button onClick={() => setEditorTab('html')}
                          className={`px-4 py-2 text-sm font-medium ${editorTab === 'html' ? 'border-b-2 border-muni-primary text-muni-primary' : 'text-slate-500'}`}>
                    <Code size={14} className="inline mr-1" /> HTML
                  </button>
                  <button onClick={() => setEditorTab('texto')}
                          className={`px-4 py-2 text-sm font-medium ${editorTab === 'texto' ? 'border-b-2 border-muni-primary text-muni-primary' : 'text-slate-500'}`}>
                    <Type size={14} className="inline mr-1" /> Texto plano
                  </button>
                </div>

                {editorTab === 'html' ? (
                  <div>
                    <label className="label">Contenido HTML *</label>
                    <textarea
                      className="input font-mono text-xs"
                      rows="20"
                      disabled={!canUpdate}
                      value={form.html}
                      onChange={(e) => setForm({ ...form, html: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Este es el cuerpo del correo (HTML completo). El email cliente lo renderizará.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Versión texto plano</label>
                    <textarea
                      className="input"
                      rows="10"
                      disabled={!canUpdate}
                      value={form.texto}
                      onChange={(e) => setForm({ ...form, texto: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Versión sin formato para clientes de email que no soportan HTML (raros). Si lo dejas vacío, se usará el HTML simplificado.
                    </p>
                  </div>
                )}
              </div>

              {/* Variables disponibles */}
              <div className="card bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm mb-2">
                  📌 Variables disponibles (haz clic para insertar)
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Usa estas variables dentro del asunto o del cuerpo. Al enviar el correo, se reemplazarán por los datos reales de la reserva.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map(v => (
                    <button key={v}
                      onClick={() => canUpdate ? insertVariable(v) : copyVariable(v)}
                      title={canUpdate ? 'Insertar variable en el editor' : 'Copiar al portapapeles'}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono hover:border-muni-primary hover:bg-blue-50 transition">
                      {'{{' + v + '}}'}
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <strong>Notas:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li><code className="bg-white px-1 rounded">{'{{motivo}}'}</code> solo aplica en la plantilla RECHAZADA.</li>
                    <li><code className="bg-white px-1 rounded">{'{{aprobador}}'}</code> aplica en APROBADA y RECHAZADA.</li>
                    <li>Si una variable no está en el contexto, se reemplaza por cadena vacía.</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL: Vista previa */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Vista previa con datos de ejemplo" size="xl">
        {previewData && (
          <div>
            <div className="bg-slate-100 p-3 rounded mb-3 text-xs">
              <strong>Asunto:</strong> {previewData.asunto}
            </div>
            <div className="border border-slate-200 rounded overflow-hidden bg-white">
              <iframe srcDoc={previewData.html} title="preview" className="w-full" style={{ height: '500px', border: 'none' }} />
            </div>
            <details className="mt-3">
              <summary className="text-xs text-slate-500 cursor-pointer">Datos de ejemplo usados</summary>
              <pre className="text-[10px] bg-slate-50 p-2 mt-2 rounded overflow-auto">{JSON.stringify(previewData.sampleData, null, 2)}</pre>
            </details>
          </div>
        )}
      </Modal>

      {/* MODAL: Enviar prueba */}
      <Modal open={testModalOpen} onClose={() => setTestModalOpen(false)} title="Enviar correo de prueba">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Se enviará la plantilla con datos de ejemplo al email que indiques. Útil para validar que la configuración SMTP funcione.
          </p>
          <div>
            <label className="label">Email destinatario *</label>
            <input type="email" className="input" placeholder="tu.correo@dominio.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900">
            Asegúrate de tener SMTP configurado en Configuración → Notificaciones por correo, y habilitado.
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setTestModalOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            <button onClick={handleSendTest} className="btn-primary flex-1">
              <Send size={14} className="inline mr-1" /> Enviar prueba
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
