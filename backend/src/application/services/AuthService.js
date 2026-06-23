const GSUserRepository = require('../../infrastructure/persistence/repositories/GSUserRepository');
const GSTokenRepository = require('../../infrastructure/persistence/repositories/GSTokenRepository');
const jwtProvider = require('../../infrastructure/security/JwtProvider');
const passwordHasher = require('../../infrastructure/security/PasswordHasher');
const { AuthError, BusinessError, ValidationError } = require('../../shared/errors/AppError');
const { generateId } = require('../../shared/utils/idGenerator');
const env = require('../../config/env');

class AuthService {
  constructor() {
    this.userRepo = new GSUserRepository();
    this.tokenRepo = new GSTokenRepository();
  }

  async login({ email, password, ip, userAgent }) {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.activo) throw new AuthError('Credenciales inválidas');

    if (user.isLocked()) {
      throw new BusinessError('ACCOUNT_LOCKED',
        `Cuenta bloqueada hasta ${user.bloqueado_hasta}`);
    }

    const ok = await passwordHasher.compare(password, user.password_hash);
    if (!ok) {
      const attempts = user.intentos_fallidos + 1;
      const updates = { intentos_fallidos: attempts };
      if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
        updates.bloqueado_hasta = new Date(Date.now() + env.LOCKOUT_DURATION_MS).toISOString();
        updates.intentos_fallidos = 0;
      }
      await this.userRepo.update(user.id, updates);
      throw new AuthError('Credenciales inválidas');
    }

    await this.userRepo.update(user.id, {
      ultimo_login: new Date().toISOString(),
      intentos_fallidos: 0,
      bloqueado_hasta: '',
    });

    const accessToken = jwtProvider.signAccess({ sub: user.id, rol: user.rol, email: user.email });
    const refresh = jwtProvider.signRefresh({ sub: user.id });

    await this.tokenRepo.create({
      id: generateId(),
      usuario_id: user.id,
      token_hash: refresh.hash,
      device_info: (userAgent || '').slice(0, 255),
      ip: ip || '',
      expira_en: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      revocado: false,
      creado_en: new Date().toISOString(),
    });

    return {
      user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, rol: user.rol },
      accessToken,
      refreshToken: refresh.token,
      expiresIn: 900,
    };
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw new AuthError('Refresh token requerido');
    let payload;
    try { payload = jwtProvider.verifyRefresh(refreshToken); }
    catch { throw new AuthError('Refresh token inválido'); }

    const hash = jwtProvider.hashToken(refreshToken);
    const stored = await this.tokenRepo.findByHash(hash);
    if (!stored) throw new AuthError('Refresh token revocado o no encontrado');

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.activo) throw new AuthError('Usuario inactivo');

    const accessToken = jwtProvider.signAccess({ sub: user.id, rol: user.rol, email: user.email });
    return { accessToken, expiresIn: 900 };
  }

  async logout(refreshToken) {
    if (!refreshToken) return;
    const hash = jwtProvider.hashToken(refreshToken);
    const stored = await this.tokenRepo.findByHash(hash);
    if (stored) await this.tokenRepo.revoke(stored.id);
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!passwordHasher.isStrong(newPassword)) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula y número');
    }
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AuthError('Usuario no encontrado');

    const ok = await passwordHasher.compare(currentPassword, user.password_hash);
    if (!ok) throw new AuthError('Contraseña actual incorrecta');

    const newHash = await passwordHasher.hash(newPassword);
    await this.userRepo.update(userId, { password_hash: newHash });
    await this.tokenRepo.revokeAllForUser(userId);
    return { success: true };
  }
}

module.exports = AuthService;
