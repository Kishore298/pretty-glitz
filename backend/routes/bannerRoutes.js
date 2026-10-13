const express = require('express');
const router = express.Router();
const { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getBanners);                         // Public: active banners for homepage
router.get('/all', protectAdmin, getAllBanners);      // Admin: all banners
router.post('/', protectAdmin, createBanner);
router.put('/:id', protectAdmin, updateBanner);
router.delete('/:id', protectAdmin, deleteBanner);

module.exports = router;
