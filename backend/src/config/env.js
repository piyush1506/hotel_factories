const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend root regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'hotel_factories_super_secure_jwt_secret_2026_key');

if (!jwtSecret || (isProduction && jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be configured and contain at least 32 characters in production.');
}

module.exports = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  PORT: process.env.PORT || 5050,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  ALLOW_MOCK_PAYMENTS: !isProduction && process.env.ALLOW_MOCK_PAYMENTS === 'true',
  ENABLE_TEST_OTP: !isProduction && process.env.ENABLE_TEST_OTP === 'true',
  DEFAULT_COMMISSION_RATE: parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 15.0,
  PLATFORM_CONVENIENCE_FEE: parseFloat(process.env.PLATFORM_CONVENIENCE_FEE) || 99.0,
  ROOM_HOLD_DURATION_MINUTES: parseInt(process.env.ROOM_HOLD_DURATION_MINUTES) || 10,
  DB_TYPE: process.env.DB_TYPE || 'postgres',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres.ezmzwdewurflhavtpihg:j5xuHFP2l01cmqoc@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',

  // Seed Account Credentials (read from .env, never hardcoded)
  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ADMIN_PHONE: process.env.ADMIN_PHONE || '',

  HOTELIER1_NAME: process.env.HOTELIER1_NAME || '',
  HOTELIER1_EMAIL: process.env.HOTELIER1_EMAIL || '',
  HOTELIER1_PASSWORD: process.env.HOTELIER1_PASSWORD || '',
  HOTELIER1_PHONE: process.env.HOTELIER1_PHONE || '',

  HOTELIER2_NAME: process.env.HOTELIER2_NAME || '',
  HOTELIER2_EMAIL: process.env.HOTELIER2_EMAIL || '',
  HOTELIER2_PASSWORD: process.env.HOTELIER2_PASSWORD || '',
  HOTELIER2_PHONE: process.env.HOTELIER2_PHONE || '',

  CUSTOMER1_NAME: process.env.CUSTOMER1_NAME || '',
  CUSTOMER1_EMAIL: process.env.CUSTOMER1_EMAIL || '',
  CUSTOMER1_PASSWORD: process.env.CUSTOMER1_PASSWORD || '',
  CUSTOMER1_PHONE: process.env.CUSTOMER1_PHONE || ''
};
