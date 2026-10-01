const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/', protectAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // multer-storage-cloudinary attaches 'path' with the Cloudinary URL
    res.json({ url: req.file.path });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

module.exports = router;
