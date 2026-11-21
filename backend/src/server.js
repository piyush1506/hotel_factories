const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const db = require('./config/database');

async function startServer() {
  await db.ready();

  const server = app.listen(config.PORT, () => {
    logger.info(`========================================================`);
    logger.info(`🚀 Hotel Factories Express Backend Running on Port ${config.PORT}`);
    logger.info(`🌐 Environment: ${config.NODE_ENV}`);
    logger.info(`🗄️ Primary Database: PostgreSQL (Supabase)`);
    logger.info(`📋 Health Check: http://localhost:${config.PORT}/api/v1/health`);
    logger.info(`========================================================`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer().catch((err) => {
  logger.error('Fatal server startup failure:', err);
  process.exit(1);
});
