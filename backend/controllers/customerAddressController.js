const User = require('../models/User');

/**
 * Helper to retrieve customer user document
 */
const getCustomerUser = async (userId) => {
  return await User.findById(userId);
};

// ─── GET /api/customer/addresses ─────────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const user = await getCustomerUser(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Customer account not found.' });

    const addresses = Array.isArray(user.addresses) ? user.addresses : [];
    // Sort default address first, followed by most recent
    const sorted = [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return res.status(200).json({ success: true, addresses: sorted });
  } catch (err) {
    console.error('[customerAddress] getAddresses error:', err);
    return res.status(500).json({ message: 'Failed to fetch addresses.' });
  }
};

// ─── POST /api/customer/addresses ────────────────────────────────────────────
const addAddress = async (req, res) => {
  try {
    const { name, mobile, addressLine, city, state, pincode, isDefault } = req.body;

    if (!addressLine || !city || !pincode) {
      return res.status(400).json({ message: 'Address, city, and 6-digit pincode are required.' });
    }

    const cleanPincode = String(pincode).trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    const user = await getCustomerUser(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Customer account not found.' });

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    // If first address or isDefault is true, make it the default
    const makeDefault = isDefault === true || user.addresses.length === 0;

    if (makeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddr = {
      name: (name && String(name).trim()) || user.name || 'Customer',
      mobile: (mobile && String(mobile).trim()) || user.mobile || '',
      addressLine: String(addressLine).trim(),
      city: String(city).trim(),
      state: (state && String(state).trim()) || 'Tamil Nadu',
      pincode: cleanPincode,
      isDefault: makeDefault,
    };

    user.addresses.push(newAddr);
    await user.save();

    const created = user.addresses[user.addresses.length - 1];
    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address: created,
      addresses: sorted,
    });
  } catch (err) {
    console.error('[customerAddress] addAddress error:', err);
    return res.status(500).json({ message: 'Failed to add address.' });
  }
};

// ─── PUT /api/customer/addresses/:addressId ──────────────────────────────────
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, mobile, addressLine, city, state, pincode, isDefault } = req.body;

    if (!addressLine || !city || !pincode) {
      return res.status(400).json({ message: 'Address, city, and 6-digit pincode are required.' });
    }

    const cleanPincode = String(pincode).trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    const user = await getCustomerUser(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Customer account not found.' });

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (isDefault === true) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      addr.isDefault = true;
    } else if (isDefault === false && addr.isDefault && user.addresses.length > 1) {
      // If unsetting default and other addresses exist, make another address default
      addr.isDefault = false;
      const other = user.addresses.find((a) => a._id.toString() !== addressId);
      if (other) other.isDefault = true;
    }

    addr.name = (name && String(name).trim()) || addr.name;
    addr.mobile = (mobile && String(mobile).trim()) || addr.mobile;
    addr.addressLine = String(addressLine).trim();
    addr.city = String(city).trim();
    addr.state = (state && String(state).trim()) || addr.state || 'Tamil Nadu';
    addr.pincode = cleanPincode;

    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address: addr,
      addresses: sorted,
    });
  } catch (err) {
    console.error('[customerAddress] updateAddress error:', err);
    return res.status(500).json({ message: 'Failed to update address.' });
  }
};

// ─── DELETE /api/customer/addresses/:addressId ───────────────────────────────
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await getCustomerUser(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Customer account not found.' });

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    const wasDefault = addr.isDefault;
    user.addresses.pull({ _id: addressId });

    // If deleted address was default and others remain, set first as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return res.status(200).json({
      success: true,
      message: 'Address removed successfully.',
      addresses: sorted,
    });
  } catch (err) {
    console.error('[customerAddress] deleteAddress error:', err);
    return res.status(500).json({ message: 'Failed to delete address.' });
  }
};

// ─── PUT /api/customer/addresses/:addressId/default ──────────────────────────
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await getCustomerUser(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Customer account not found.' });

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return res.status(200).json({
      success: true,
      message: 'Default address updated.',
      addresses: sorted,
    });
  } catch (err) {
    console.error('[customerAddress] setDefaultAddress error:', err);
    return res.status(500).json({ message: 'Failed to set default address.' });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
