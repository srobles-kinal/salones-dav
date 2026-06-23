class User {
  constructor({ id, email, password_hash, nombre_completo, rol, departamento,
    activo = true, intentos_fallidos = 0, bloqueado_hasta = null,
    ultimo_login = null, creado_en = null, creado_por = null, actualizado_en = null }) {
    this.id = id;
    this.email = email;
    this.password_hash = password_hash;
    this.nombre_completo = nombre_completo;
    this.rol = rol;
    this.departamento = departamento;
    this.activo = activo === true || activo === 'TRUE' || activo === 'true';
    this.intentos_fallidos = parseInt(intentos_fallidos || 0, 10);
    this.bloqueado_hasta = bloqueado_hasta || null;
    this.ultimo_login = ultimo_login;
    this.creado_en = creado_en;
    this.creado_por = creado_por;
    this.actualizado_en = actualizado_en;
  }

  isLocked() {
    if (!this.bloqueado_hasta) return false;
    return new Date(this.bloqueado_hasta) > new Date();
  }

  toPublic() {
    const { password_hash, ...rest } = this;
    return rest;
  }
}

module.exports = User;
