import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Gujarat',
  'Delhi',
  'Puducherry',
  'Other States',
];

const AddressModal = ({ isOpen, onClose, initialData = null, onSaved, isCustomerLoggedIn = true }) => {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    addressLine: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    isDefault: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        mobile: initialData.mobile || '',
        addressLine: initialData.addressLine || initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || 'Tamil Nadu',
        pincode: initialData.pincode || '',
        isDefault: Boolean(initialData.isDefault),
      });
    } else {
      setFormData({
        name: '',
        mobile: '',
        addressLine: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        isDefault: false,
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialData && initialData._id);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name.trim()) {
      setError('Please enter recipient full name');
      return;
    }
    const cleanMobile = formData.mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!formData.addressLine.trim() || formData.addressLine.trim().length < 5) {
      setError('Please provide a complete street address (house/flat no, street, landmark)');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please enter city / town');
      return;
    }
    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      mobile: cleanMobile,
      addressLine: formData.addressLine.trim(),
      city: formData.city.trim(),
      state: formData.state.trim() || 'Tamil Nadu',
      pincode: cleanPin,
      isDefault: formData.isDefault,
    };

    try {
      if (isCustomerLoggedIn) {
        let res;
        if (isEditing) {
          res = await api.put(`/customer/addresses/${initialData._id}`, payload);
        } else {
          res = await api.post('/customer/addresses', payload);
        }

        if (res.data?.success) {
          if (onSaved) onSaved(res.data.address || payload, res.data.addresses);
          onClose();
        }
      } else {
        // Guest mode fallback (saved locally in storage)
        const localId = isEditing ? initialData._id : 'guest_addr_' + Date.now();
        const savedGuestAddr = { ...payload, _id: localId };
        if (onSaved) onSaved(savedGuestAddr);
        onClose();
      }
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.response?.data?.message || 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF8F5',
    border: `1.5px solid var(--border)`,
    color: 'var(--text)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            background: isDark ? '#14141E' : '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 520,
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              background: isDark ? '#14141E' : '#FFFFFF',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(196, 56, 108, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                  {isEditing ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Accurate details ensure prompt doorstep dispatch
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#EF4444',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Recipient Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Recipient Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Priya Lakshmi"
                    value={formData.name}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Contact Mobile *</label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div>
                <label style={labelStyle}>House / Flat / Street / Landmark *</label>
                <textarea
                  name="addressLine"
                  required
                  rows="3"
                  placeholder="e.g. Flat 302, Sai Vihar Apartments, 12th Cross, Near Temple"
                  value={formData.addressLine}
                  onChange={handleChange}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* City, State, PIN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <div>
                  <label style={labelStyle}>City / Town *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Chennai"
                    value={formData.city}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st} style={{ background: isDark ? '#14141E' : '#FFF' }}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    maxLength="6"
                    placeholder="6 digits"
                    value={formData.pincode}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Default Address Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 6,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: 'var(--accent)',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.86rem', color: 'var(--text)', fontWeight: 600 }}>
                  Make this my default delivery address
                </span>
              </label>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 24,
                borderTop: '1px solid var(--border)',
                paddingTop: 18,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(196, 56, 108, 0.35)',
                }}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Check size={16} />
                    {isEditing ? 'Update Address' : 'Save Address'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddressModal;
