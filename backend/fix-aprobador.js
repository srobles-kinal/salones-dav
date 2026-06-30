#!/usr/bin/env node
/**
 * Parchea ReservationService.js para que en los correos el {{aprobador}}
 * muestre el nombre completo del usuario en lugar del email.
 *
 * Uso: node fix-aprobador.js
 * (colócalo en la carpeta backend/ y córrelo desde ahí)
 *
 * Hace respaldo automático: ReservationService.js.bak
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'src/application/services/ReservationService.js');

if (!fs.existsSync(FILE)) {
  console.error('❌ No encontré ReservationService.js. Corre este script desde la carpeta backend/.');
  process.exit(1);
}

let code = fs.readFileSync(FILE, 'utf8');
const original = code;

// Respaldo
fs.writeFileSync(FILE + '.bak', original, 'utf8');
console.log('💾 Respaldo creado: ReservationService.js.bak');

// 1) Asegurar import del repo de usuarios
if (!/GSUserRepository/.test(code)) {
  // Insertar el require después del primer require existente
  code = code.replace(
    /(const .*require\(['"][^'"]+['"]\);\n)/,
    `$1const GSUserRepository = require('../../infrastructure/persistence/repositories/GSUserRepository');\n`
  );
  console.log('✓ Import de GSUserRepository agregado');
} else {
  console.log('ℹ️  GSUserRepository ya estaba importado');
}

// 2) Asegurar instancia en el constructor
if (!/this\.userRepo/.test(code)) {
  // Buscar el constructor y agregar la instancia
  code = code.replace(
    /(constructor\s*\([^)]*\)\s*\{)/,
    `$1\n    this.userRepo = new GSUserRepository();`
  );
  console.log('✓ this.userRepo agregado al constructor');
} else {
  console.log('ℹ️  this.userRepo ya existía');
}

// 3) Agregar helper _getUserName si no existe
if (!/_getUserName/.test(code)) {
  // Insertarlo justo antes del primer "async create" o "async approve"
  const helper = `
  async _getUserName(userId) {
    try {
      const u = await this.userRepo.findById(userId);
      return (u && u.nombre_completo) ? u.nombre_completo : userId;
    } catch (e) { return userId; }
  }
`;
  code = code.replace(/(\n\s*async\s+create\s*\()/, `${helper}$1`);
  console.log('✓ Helper _getUserName agregado');
} else {
  console.log('ℹ️  _getUserName ya existía');
}

// 4) Reemplazar el envío en approve: user.email -> nombre
//    Patrón: notifyReservationApproved(updated, salonName, user.email)
if (/notifyReservationApproved\([^)]*user\.email\)/.test(code)) {
  code = code.replace(
    /(this\.notifier\.notifyReservationApproved\(\s*updated\s*,\s*salonName\s*,\s*)user\.email(\s*\))/,
    `const _aprobadorNombre = await this._getUserName(user.id);\n    $1_aprobadorNombre$2`
  );
  console.log('✓ approve(): ahora usa nombre del aprobador');
} else if (/notifyReservationApproved/.test(code) && /_aprobadorNombre/.test(code)) {
  console.log('ℹ️  approve() ya estaba parcheado');
} else {
  console.log('⚠️  No pude parchear approve() automáticamente. Revisa manualmente la línea de notifyReservationApproved.');
}

// 5) Reemplazar el envío en reject
if (/notifyReservationRejected\([^)]*user\.email\)/.test(code)) {
  code = code.replace(
    /(this\.notifier\.notifyReservationRejected\(\s*updated\s*,\s*salonName\s*,\s*motivoFinal\s*,\s*)user\.email(\s*\))/,
    `const _rechazadorNombre = await this._getUserName(user.id);\n    $1_rechazadorNombre$2`
  );
  console.log('✓ reject(): ahora usa nombre del aprobador');
} else if (/notifyReservationRejected/.test(code) && /_rechazadorNombre/.test(code)) {
  console.log('ℹ️  reject() ya estaba parcheado');
} else {
  console.log('⚠️  No pude parchear reject() automáticamente. Revisa manualmente la línea de notifyReservationRejected.');
}

if (code === original) {
  console.log('\n⚠️  No se hicieron cambios. Puede que ya estuviera parcheado o el formato sea distinto.');
} else {
  fs.writeFileSync(FILE, code, 'utf8');
  console.log('\n✅ ReservationService.js actualizado.');
  console.log('   Verifica que arranca: npm run dev');
  console.log('   Si algo sale mal, restaura: mv src/application/services/ReservationService.js.bak src/application/services/ReservationService.js');
}
