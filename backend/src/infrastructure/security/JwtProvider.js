const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');

const ISSUER = 'salones-dav-api';
const AUDIENCE = 'salones-dav-web';

const signAccess = (payload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, {
  expiresIn: env.JWT_ACCESS_TTL, algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE,
});

const signRefresh = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL, algorithm: 'HS256', issuer: ISSUER,
  });
  return { token, jti, hash: crypto.createHash('sha256').update(token).digest('hex') };
};

const verifyAccess = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET, {
  issuer: ISSUER, audience: AUDIENCE,
});

const verifyRefresh = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISSUER });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, hashToken };
