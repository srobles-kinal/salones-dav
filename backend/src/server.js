require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const env = require('./config/env');

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 API corriendo en puerto ${env.PORT} | entorno=${env.NODE_ENV} | TZ=${process.env.TZ}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION', { error: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando con gracia...');
  server.close(() => process.exit(0));
});
