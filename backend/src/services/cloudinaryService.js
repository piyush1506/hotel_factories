const https = require('https');
const { Readable } = require('stream');
const { cloudinary, isConfigured, defaultFolder, cloudName } = require('../config/cloudinary');
const logger = require('../utils/logger');

class CloudinaryService {
  constructor() {
    this.timeOffsetMs = 0;
    this.lastSync = 0;
    if (isConfigured) {
      this.syncServerTime().catch(() => {});
    }
  }

  /**
   * Sync time with Cloudinary server to avoid clock drift / stale request errors
   */
  async syncServerTime() {
    return new Promise((resolve) => {
      try {
        const req = https.request('https://api.cloudinary.com', { method: 'HEAD', timeout: 5000 }, (res) => {
          if (res.headers.date) {
            const serverTime = new Date(res.headers.date).getTime();
            const localTime = Date.now();
            this.timeOffsetMs = serverTime - localTime;
            this.lastSync = Date.now();
            logger.info(`Cloudinary clock skew synchronized. Offset: ${Math.round(this.timeOffsetMs / 1000)}s`);
          }
          resolve(this.timeOffsetMs);
        });
        req.on('error', (err) => {
          logger.warn('Could not sync time with Cloudinary server, using local time:', err.message);
          resolve(0);
        });
        req.on('timeout', () => {
          req.destroy();
          resolve(0);
        });
        req.end();
      } catch (e) {
        resolve(0);
      }
    });
  }

  /**
   * Get adjusted timestamp in seconds
   */
  getAdjustedTimestamp() {
    return Math.floor((Date.now() + this.timeOffsetMs) / 1000);
  }

  /**
   * Check if Cloudinary credentials are fully active
   */
  isReady() {
    return isConfigured;
  }

  /**
   * Get public configuration status
   */
  getStatus() {
    return {
      configured: isConfigured,
      cloudName: isConfigured ? cloudName : null,
      folder: defaultFolder,
      mode: isConfigured ? 'live' : 'mock_preview',
      clockOffsetSec: Math.round(this.timeOffsetMs / 1000)
    };
  }

  /**
   * Upload an in-memory buffer (from multer) to Cloudinary
   */
  async uploadBuffer(buffer, options = {}) {
    const folder = options.folder || defaultFolder;

    if (!isConfigured) {
      logger.info('Cloudinary not configured, returning data-uri preview fallback');
      const mimeType = options.mimetype || 'image/jpeg';
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      return {
        url: dataUri,
        secure_url: dataUri,
        public_id: `local_preview_${Date.now()}`,
        format: mimeType.split('/')[1] || 'jpg',
        bytes: buffer.length,
        width: 1200,
        height: 800,
        isMock: true,
        message: 'Cloudinary credentials missing in backend/.env. Served as data URI.'
      };
    }

    // Refresh skew if not synced in the last hour
    if (Date.now() - this.lastSync > 3600000) {
      await this.syncServerTime();
    }

    const performUpload = (timestamp) => {
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          folder,
          resource_type: 'image',
          timestamp,
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          ...options,
        };

        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url || result.url,
            secure_url: result.secure_url || result.url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            isMock: false
          });
        });

        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
      });
    };

    try {
      return await performUpload(this.getAdjustedTimestamp());
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('stale request')) {
        logger.warn('Stale request encountered, re-synchronizing clock with Cloudinary and retrying...');
        await this.syncServerTime();
        return await performUpload(this.getAdjustedTimestamp());
      }
      throw err;
    }
  }

  /**
   * Upload a base64 Data URI or remote URL to Cloudinary
   */
  async uploadBase64OrUrl(dataUriOrUrl, options = {}) {
    const folder = options.folder || defaultFolder;

    if (!isConfigured) {
      logger.info('Cloudinary not configured, returning direct URL or data URI fallback');
      return {
        url: dataUriOrUrl,
        secure_url: dataUriOrUrl,
        public_id: `local_preview_${Date.now()}`,
        format: 'jpg',
        bytes: dataUriOrUrl.length,
        width: 1200,
        height: 800,
        isMock: true,
        message: 'Cloudinary credentials missing in backend/.env. Served as local URI/URL.'
      };
    }

    // Refresh skew if not synced in the last hour
    if (Date.now() - this.lastSync > 3600000) {
      await this.syncServerTime();
    }

    const performUpload = (timestamp) => {
      return cloudinary.uploader.upload(dataUriOrUrl, {
        folder,
        resource_type: 'image',
        timestamp,
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options,
      }).then(result => ({
        url: result.secure_url || result.url,
        secure_url: result.secure_url || result.url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        isMock: false
      }));
    };

    try {
      return await performUpload(this.getAdjustedTimestamp());
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('stale request')) {
        logger.warn('Stale request encountered, re-synchronizing clock with Cloudinary and retrying...');
        await this.syncServerTime();
        return await performUpload(this.getAdjustedTimestamp());
      }
      throw err;
    }
  }

  /**
   * Delete image from Cloudinary by publicId
   */
  async deleteImage(publicId) {
    if (!isConfigured || !publicId || publicId.startsWith('local_preview_')) {
      return { result: 'ok', isMock: true };
    }
    return cloudinary.uploader.destroy(publicId);
  }
}

module.exports = new CloudinaryService();
