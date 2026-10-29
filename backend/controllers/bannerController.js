const Banner = require('../models/Banner');

const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const normalizeImage = (img) => {
  if (!img) return undefined;
  if (typeof img === 'string') return { url: img };
  if (typeof img === 'object' && img.url) return img;
  return undefined;
};

const createBanner = async (req, res) => {
  try {
    const { title, mobileImage, tabletImage, desktopImage, isActive, order } = req.body;
    const banner = new Banner({
      title: title || 'Homepage Hero Banner',
      mobileImage: normalizeImage(mobileImage),
      tabletImage: normalizeImage(tabletImage),
      desktopImage: normalizeImage(desktopImage),
      isActive: isActive !== undefined ? isActive : true,
      order: typeof order === 'number' ? order : 0,
    });
    const saved = await banner.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create Banner Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBanner = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.mobileImage !== undefined) {
      updateData.mobileImage = normalizeImage(updateData.mobileImage);
    }
    if (updateData.tabletImage !== undefined) {
      updateData.tabletImage = normalizeImage(updateData.tabletImage);
    }
    if (updateData.desktopImage !== undefined) {
      updateData.desktopImage = normalizeImage(updateData.desktopImage);
    }
    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(banner);
  } catch (error) {
    console.error('Update Banner Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
