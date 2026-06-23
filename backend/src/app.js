const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const hpp = require('hpp');
const xss = require('xss-clean');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./interfaces/http/routes');
const errorMiddleware = require('./interfaces/http/middlewares/error.middleware');
const { globalLimiter } = require('./interfaces/http/middlewares/rateLimit.middleware');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = env.ALLOWED_ORIGINS;
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqueado para ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(xss());
app.use(hpp({ whitelist: ['fecha', 'estado', 'rol'] }));

app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));

app.use(globalLimiter);

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Ruta ${req.method} ${req.originalUrl} no encontrada` },
  });
});

app.use(errorMiddleware);

module.exports = app;
