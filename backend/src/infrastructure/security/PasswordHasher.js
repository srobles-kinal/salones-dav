const bcrypt = require('bcryptjs');
const env = require('../../config/env');

const hash = (plain) => bcrypt.hash(plain, env.BCRYPT_COST);
const compare = (plain, hashed) => bcrypt.compare(plain, hashed);

const isStrong = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpper && hasLower && hasNumber;
};

module.exports = { hash, compare, isStrong };
