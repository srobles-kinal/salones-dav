class LactationSession {
  constructor(d) { Object.assign(this, d); }
  isActive() { return this.estado === 'ACTIVA'; }
  isExpired() { return new Date() > new Date(this.hora_salida_estimada); }
}
module.exports = LactationSession;
