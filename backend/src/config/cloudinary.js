const cloudinary = require('cloudinary').v2;
const config = require('./env');
const logger = require('../utils/logger');

const isConfigured = Boolean(
  config.CLOUDINARY_URL ||
  (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET)
);

if (config.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: config.CLOUDINARY_URL,
    secure: true,
  });
  logger.info('Cloudinary configured via CLOUDINARY_URL');
} else if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info(`Cloudinary configured for cloud_name: ${config.CLOUDINARY_CLOUD_NAME}`);
} else {
  logger.warn('Cloudinary credentials not provided in .env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Uploads will operate in mock preview mode.');
}

module.exports = {
  cloudinary,
  isConfigured,
  defaultFolder: config.CLOUDINARY_FOLDER || 'hotel_factories',
  cloudName: config.CLOUDINARY_CLOUD_NAME || ''
};
