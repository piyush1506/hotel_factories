const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { optionalAuth } = require('../middleware/auth');

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are permitted'), false);
    }
  }
});

// Cloudinary config & readiness check
router.get('/config', uploadController.getConfig);

// Upload single image (supports multer 'image' or 'file', or JSON body)
router.post('/image', optionalAuth, upload.single('image'), uploadController.uploadImage);

// Upload multiple images (supports up to 10 images)
router.post('/multiple', optionalAuth, upload.array('images', 10), uploadController.uploadMultiple);

// Delete image by public_id
router.delete('/:publicId', optionalAuth, uploadController.deleteImage);

module.exports = router;
