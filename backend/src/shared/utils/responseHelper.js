const ok = (res, data, status = 200) => res.status(status).json({
  success: true, data, meta: { timestamp: new Date().toISOString(), version: 'v1' },
});

const fail = (res, code, message, status = 400, details = null) => res.status(status).json({
  success: false, error: { code, message, ...(details && { details }) },
  meta: { timestamp: new Date().toISOString(), version: 'v1' },
});

module.exports = { ok, fail };
