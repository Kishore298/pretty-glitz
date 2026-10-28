import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Gem,
  Tag,
  Star,
  Eye,
  CheckCircle2,
  Upload,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const field = (label, children, hint) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>{hint}</p>}
  </div>
);

const AddEditProductModal = ({ isOpen, onClose, productId, onSuccess, isOfferPreset = false }) => {
  const isEdit = Boolean(productId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    subcategoryId: '',
    isBestseller: false,
    isFlagship: false,
    isOffer: isOfferPreset,
    isActive: true,
    inStock: true,
    sizes: [],
    images: [],
    giftBoxDetails: '',
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSubcategories();
      if (isEdit) fetchProduct();
      else {
        setFormData({
          name: '',
          description: '',
          price: '',
          originalPrice: '',
          category: categories.length > 0 ? categories[0].name : '',
          subcategoryId: '',
          isBestseller: false,
          isFlagship: false,
          isOffer: isOfferPreset,
          isActive: true,
          inStock: true,
          sizes: [],
          images: [],
          giftBoxDetails: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isOpen]);

  const fetchCategories = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
    if (!isEdit && data.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: data[0].name }));
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data } = await api.get('/subcategories');
      setSubcategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${productId}`);
      setFormData({
        ...data,
        isBestseller: Boolean(data.isBestseller || data.isFlagship),
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch product details.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddSize = () =>
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', order: prev.sizes.length }],
    }));

  const handleSizeChange = (index, value) => {
    const s = [...formData.sizes];
    s[index].size = value;
    setFormData({ ...formData, sizes: s });
  };

  const handleRemoveSize = (index) =>
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const form = new FormData();
    form.append('image', file);

    try {
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), { url: data.url }],
      }));
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/products/${productId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Error saving product. Please verify fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const sectionStyle = {
    background: 'var(--surface-primary, #14131E)',
    border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
    borderRadius: 16,
    padding: '22px 24px',
    marginBottom: 18,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 6, 11, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #181726 0%, #12111A 100%)',
              width: '100%',
              maxWidth: 840,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 22,
              border: '1px solid rgba(201, 168, 76, 0.25)',
              padding: '36px 38px',
              position: 'relative',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
            }}
            className="no-scrollbar"
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 22,
                right: 22,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                width: 34,
                height: 34,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(201, 168, 76, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                  }}
                >
                  <Gem size={18} />
                </div>
                <h2
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {isEdit ? 'Edit Catalog Piece' : 'Add New Jewellery Piece'}
                </h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                {isEdit
                  ? 'Update product pricing, gallery photos, sizes, and collection visibility'
                  : 'Add a new product with multiple angles, sizes, and stock availability'}
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#F87171',
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 20,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    1. Product Overview
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                    {field(
                      'Product Name *',
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Matte Gold Temple Kasu Bangle Set"
                        className="admin-input"
                      />
                    )}
                    {field(
                      'Main Category *',
                      <select name="category" value={formData.category} onChange={handleChange} className="admin-input">
                        {categories.map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
                    {field(
                      'Description *',
                      <textarea
                        name="description"
                        required
                        rows="3"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Detailed material, craftsmanship, styling advice..."
                        className="admin-input"
                        style={{ resize: 'vertical' }}
                      />
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(formData.category?.toLowerCase() === 'artificial flowers' ||
                        formData.category?.toLowerCase() === 'bangles') &&
                        field(
                          'Subcategory / Type',
                          <select
                            name="subcategoryId"
                            value={formData.subcategoryId || ''}
                            onChange={handleChange}
                            className="admin-input"
                          >
                            <option value="">-- Choose Subcategory --</option>
                            {subcategories
                              .filter((s) => {
                                const c = categories.find((cat) => cat.name === formData.category);
                                const sCatId = typeof s.category === 'object' ? s.category?._id : s.category;
                                return c && sCatId === c._id;
                              })
                              .map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        )}

                      {formData.category?.toLowerCase() === 'gift box combo' &&
                        field(
                          'Combo Package Details *',
                          <textarea
                            name="giftBoxDetails"
                            required
                            rows="2"
                            value={formData.giftBoxDetails || ''}
                            onChange={handleChange}
                            placeholder="Items included in gift hamper..."
                            className="admin-input"
                            style={{ resize: 'vertical' }}
                          />
                        )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {field(
                      'Selling Price (₹) *',
                      <input
                        type="number"
                        name="price"
                        required
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="e.g. 999"
                        className="admin-input"
                      />
                    )}
                    {field(
                      'Original MRP Price (₹)',
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleChange}
                        placeholder="e.g. 1499 (optional, for discount slash)"
                        className="admin-input"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bangle Sizes */}
              {(formData.category || '').toLowerCase().includes('bangles') && (
                <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      2. Available Bangle Sizes
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.75rem', gap: 5 }}
                    >
                      <Plus size={13} /> Add Size Option
                    </button>
                  </div>
                  {formData.sizes.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic', margin: 0 }}>
                      No sizes added yet. Customers will need a size selector on the detail page to place orders.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                      {formData.sizes.map((sizeObj, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 10,
                            padding: '8px 12px',
                            border: '1px solid var(--card-border)',
                          }}
                        >
                          <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.78rem' }}>#{idx + 1}</span>
                          <input
                            type="text"
                            value={sizeObj.size}
                            onChange={(e) => handleSizeChange(idx, e.target.value)}
                            placeholder="e.g. 2.4, 2.6"
                            required
                            className="admin-input"
                            style={{ padding: '6px 10px', height: 34, fontSize: '0.84rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Product Gallery Images */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    3. Showcase Photography Gallery
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    First photo is primary card image
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
                  {(formData.images || []).map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 94,
                        height: 94,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: idx === 0 ? '2px solid var(--accent-gold)' : '1px solid var(--card-border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        flexShrink: 0,
                      }}
                    >
                      <img src={img.url} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {idx === 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(201, 168, 76, 0.85)',
                            color: '#0A0A0F',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            textAlign: 'center',
                            padding: '2px 0',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Primary
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) });
                        }}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.75)',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 94,
                      height: 94,
                      borderRadius: 12,
                      border: '1px dashed rgba(201, 168, 76, 0.4)',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      background: 'rgba(201, 168, 76, 0.04)',
                      color: 'var(--accent-gold)',
                      transition: 'all 0.2s ease',
                      gap: 4,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingImage) {
                        e.currentTarget.style.borderColor = 'var(--accent-gold)';
                        e.currentTarget.style.background = 'rgba(201, 168, 76, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!uploadingImage) {
                        e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.4)';
                        e.currentTarget.style.background = 'rgba(201, 168, 76, 0.04)';
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                    {uploadingImage ? (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '2px solid rgba(201, 168, 76, 0.3)',
                          borderTopColor: 'var(--accent-gold)',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    ) : (
                      <>
                        <Upload size={20} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Add Photo</span>
                      </>
                    )}
                  </label>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>

              {/* Status & Display Badges Settings */}
              <div style={sectionStyle}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                  4. Visibility & Stock Badges
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {[
                    {
                      name: 'isBestseller',
                      label: 'Bestseller Feature',
                      desc: 'Showcases item in the curated Best Sellers section on homepage',
                      Icon: Star,
                      color: 'var(--accent-gold)',
                    },
                    {
                      name: 'isOffer',
                      label: 'Special Offer Tag',
                      desc: 'Highlights item in special offers banner with discount ribbons',
                      Icon: Tag,
                      color: 'var(--accent-pink)',
                    },
                    {
                      name: 'isActive',
                      label: 'Live on Storefront',
                      desc: 'Turn off to temporarily hide piece from customer catalog',
                      Icon: Eye,
                      color: '#10B981',
                    },
                    {
                      name: 'inStock',
                      label: 'Inventory In-Stock',
                      desc: 'Uncheck if sold out to disable purchase on the customer cart',
                      Icon: CheckCircle2,
                      color: '#34D399',
                    },
                  ].map(({ name, label, desc, Icon, color }) => (
                    <div
                      key={name}
                      onClick={() => setFormData((prev) => ({ ...prev, [name]: !prev[name] }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        cursor: 'pointer',
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: formData[name] ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: formData[name] ? `1px solid ${color}` : '1px solid var(--card-border)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: formData[name] ? `${color}25` : 'rgba(255, 255, 255, 0.04)',
                          color: formData[name] ? color : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>{label}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 2, lineHeight: 1.35 }}>{desc}</div>
                      </div>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: formData[name] ? `2px solid ${color}` : '2px solid rgba(255, 255, 255, 0.2)',
                          background: formData[name] ? color : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0A0A0F',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {formData[name] && <CheckCircle2 size={14} color="#FFFFFF" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ minWidth: 150, justifyContent: 'center', padding: '10px 24px', gap: 8 }}
                >
                  {saving ? (
                    'Saving Piece...'
                  ) : isEdit ? (
                    'Save Changes'
                  ) : (
                    <>
                      <Plus size={16} /> List Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddEditProductModal;
