const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security and compression
app.use(helmet({ crossOriginResourcePolicy: false }));
const config = require('./config/env');
const allowedOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS policy.');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: !allowedOrigins.includes('*')
}));
app.use(compression());

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({
  limit: '25mb',
  verify(req, res, buffer) {
    if (req.originalUrl.includes('/payments/webhook')) req.rawBody = buffer;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: '🏨 Welcome to Hotel Factories API Gateway',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      auth: '/api/v1/auth',
      hotels: '/api/v1/hotels',
      rooms: '/api/v1/rooms',
      bookings: '/api/v1/bookings',
      payments: '/api/v1/payments',
      payouts: '/api/v1/payouts',
      admin: '/api/v1/admin',
      hotelier: '/api/v1/hotelier',
      upload: '/api/v1/upload'
    }
  });
});

// Mount API routes
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
