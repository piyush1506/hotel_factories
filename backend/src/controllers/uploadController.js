const cloudinaryService = require('../services/cloudinaryService');
const logger = require('../utils/logger');

exports.getConfig = async (req, res) => {
  try {
    const status = cloudinaryService.getStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const folder = req.body?.folder || req.query?.folder || 'hotel_factories/hotels';

    // 1. Check if uploaded via multer (file stream)
    if (req.file) {
      const result = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder,
        mimetype: req.file.mimetype
      });
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: result
      });
    }

    // 2. Check if uploaded via body (base64 data URI or remote image URL)
    const imagePayload = req.body?.image || req.body?.file || req.body?.url;
    if (imagePayload && typeof imagePayload === 'string') {
      const result = await cloudinaryService.uploadBase64OrUrl(imagePayload, {
        folder
      });
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: result
      });
    }

    return res.status(400).json({
      success: false,
      message: 'No image provided. Please send a file or base64 data URI string.'
    });
  } catch (error) {
    logger.error('Upload controller failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed'
    });
  }
};

exports.uploadMultiple = async (req, res) => {
  try {
    const folder = req.body?.folder || req.query?.folder || 'hotel_factories/hotels';
    const uploads = [];

    // Multer files
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinaryService.uploadBuffer(file.buffer, {
          folder,
          mimetype: file.mimetype
        });
        uploads.push(result);
      }
      return res.status(200).json({
        success: true,
        count: uploads.length,
        data: uploads
      });
    }

    // Base64 array in body
    if (req.body?.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      for (const img of req.body.images) {
        const result = await cloudinaryService.uploadBase64OrUrl(img, { folder });
        uploads.push(result);
      }
      return res.status(200).json({
        success: true,
        count: uploads.length,
        data: uploads
      });
    }

    return res.status(400).json({
      success: false,
      message: 'No images provided for multiple upload'
    });
  } catch (error) {
    logger.error('Multiple upload controller failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Multiple upload failed'
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId required' });
    }
    const result = await cloudinaryService.deleteImage(publicId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
