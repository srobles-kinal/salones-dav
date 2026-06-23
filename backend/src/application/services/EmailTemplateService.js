const GSEmailTemplateRepository = require('../../infrastructure/persistence/repositories/GSEmailTemplateRepository');
const { DEFAULT_TEMPLATES } = require('../../infrastructure/notifications/defaultTemplates');
const { TEMPLATE_KEYS } = require('../../config/constants');
const { NotFoundError, ValidationError } = require('../../shared/errors/AppError');

const ALLOWED_VARIABLES = [
  'solicitante_nombre', 'solicitante_email', 'codigo', 'tema', 'descripcion',
  'salon', 'fecha', 'hora_inicio', 'hora_fin', 'participantes', 'departamento',
  'aprobador', 'motivo',
];

const SAMPLE_DATA = {
  solicitante_nombre: 'María García López',
  solicitante_email: 'maria.garcia@ejemplo.com',
  codigo: 'RES-20260527-0042',
  tema: 'Capacitación en atención al ciudadano',
  descripcion: 'Taller sobre comunicación efectiva',
  salon: 'Salón Principal',
  fecha: '2026-06-15',
  hora_inicio: '09:00',
  hora_fin: '12:00',
  participantes: '25',
  departamento: 'Recursos Humanos',
  aprobador: 'admin@muniguate.gt',
  motivo: 'El salón está reservado para otra actividad institucional',
};

/**
 * Reemplaza {{variable}} en una cadena por su valor desde data.
 * Variables no presentes en data se reemplazan por cadena vacía.
 */
function renderTemplate(template, data = {}) {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key) => {
    if (key in data) return String(data[key] ?? '');
    return '';
  });
}

class EmailTemplateService {
  constructor() { this.repo = new GSEmailTemplateRepository(); }

  async list() {
    const stored = await this.repo.findAll();
    const result = [];
    for (const key of Object.keys(DEFAULT_TEMPLATES)) {
      const def = DEFAULT_TEMPLATES[key];
      const found = stored.find(t => t.codigo === key);
      result.push({
        codigo: key,
        nombre: def.nombre,
        estado: def.estado,
        asunto: found?.asunto || def.asunto,
        html: found?.html || def.html,
        texto: found?.texto || def.texto,
        customizado: !!found,
        actualizado_en: found?.actualizado_en || null,
        actualizado_por: found?.actualizado_por || null,
      });
    }
    return { templates: result, variables: ALLOWED_VARIABLES };
  }

  async get(codigo) {
    if (!(codigo in DEFAULT_TEMPLATES)) throw new NotFoundError('Plantilla no encontrada');
    const stored = await this.repo.findByCode(codigo);
    const def = DEFAULT_TEMPLATES[codigo];
    return {
      codigo,
      nombre: def.nombre,
      estado: def.estado,
      asunto: stored?.asunto || def.asunto,
      html: stored?.html || def.html,
      texto: stored?.texto || def.texto,
      customizado: !!stored,
      variables: ALLOWED_VARIABLES,
    };
  }

  async update(codigo, data, userId) {
    if (!(codigo in DEFAULT_TEMPLATES)) throw new NotFoundError('Plantilla no encontrada');
    const { asunto, html, texto } = data;
    if (!asunto || !html) throw new ValidationError('asunto y html son obligatorios');
    await this.repo.upsert(codigo, { asunto, html, texto: texto || '' }, userId);
    return this.get(codigo);
  }

  /**
   * Restaura una plantilla a su versión por defecto eliminando el override.
   */
  async resetToDefault(codigo, userId) {
    if (!(codigo in DEFAULT_TEMPLATES)) throw new NotFoundError('Plantilla no encontrada');
    const def = DEFAULT_TEMPLATES[codigo];
    await this.repo.upsert(codigo, {
      asunto: def.asunto, html: def.html, texto: def.texto,
    }, userId);
    return this.get(codigo);
  }

  /**
   * Renderiza una plantilla con datos reales.
   * Usado por NotificationService.
   */
  async render(codigo, data) {
    const tpl = await this.get(codigo);
    return {
      asunto: renderTemplate(tpl.asunto, data),
      html: renderTemplate(tpl.html, data),
      texto: renderTemplate(tpl.texto, data),
    };
  }

  /**
   * Genera vista previa con datos de ejemplo. Útil para el editor.
   */
  preview(asunto, html, texto, overrideData = {}) {
    const data = { ...SAMPLE_DATA, ...overrideData };
    return {
      asunto: renderTemplate(asunto, data),
      html: renderTemplate(html, data),
      texto: renderTemplate(texto, data),
      sampleData: data,
    };
  }
}

module.exports = { EmailTemplateService, renderTemplate, ALLOWED_VARIABLES };
