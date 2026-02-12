const express = require('express');
require('dotenv').config();
const path = require('path');
const db = require('./config/db'); // initialize connection
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./docs/swagger');
const { securityHeaders, cors, requireJson, rateLimit } = require('./utils/security');
const { requestId, requestLogger } = require('./utils/requestLogger');
const { validateConfig } = require('./utils/config');
const { ensureSeedAdmin } = require('./utils/adminSeed');
const { ensureDatabaseAndTables } = require('./utils/dbBootstrap');
const { ensureUploadsDir } = require('./utils/uploads');

const app = express();

const safeErrorText = (err) => {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err.slice(0, 500);
  if (err instanceof Error) {
    const name = typeof err.name === 'string' ? err.name : 'Error';
    const message = typeof err.message === 'string' ? err.message : 'Unknown error';
    return `${name}: ${message}`.slice(0, 500);
  }
  return 'non-error rejection';
};

const logError = (prefix, err) => {
  console.error(`${prefix}${safeErrorText(err)}`);
};

// Middleware
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
app.use(express.json({
  limit: '8mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(securityHeaders);
app.use(cors());
app.use(requireJson);
app.use(requestId);
app.use(requestLogger);

// Basic rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX),
}));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/foods', require('./routes/foodRoutes'));
app.use('/cart', require('./routes/cartRoutes'));
app.use('/orders', require('./routes/orderRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/payments', require('./routes/paymentRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'READY', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logError('Unhandled error: ', err);
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT);
validateConfig();
let server;
const startServer = async () => {
  await ensureDatabaseAndTables();
  await ensureUploadsDir();
  const connection = await db.getConnection();
  connection.release();
  console.log('Database ready');
  await ensureSeedAdmin();
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
};

startServer().catch((err) => {
  logError('Failed to start server: ', err);
  process.exit(1);
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down...`);
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(async () => {
    try {
      await db.end();
      process.exit(0);
    } catch (err) {
      logError('Error during shutdown: ', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logError('Unhandled promise rejection: ', reason);
  shutdown('UNHANDLED_REJECTION');
});
process.on('uncaughtException', (err) => {
  logError('Uncaught exception: ', err);
  shutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;
