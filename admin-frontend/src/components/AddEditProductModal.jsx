import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';


const field = (label, children, hint) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ fontSize: '0.75rem', color: '#3a3a50', marginTop: 5 }}>{hint}</p>}
  </div>
);

const AddEditProductModal = ({ isOpen, onClose, productId, onSuccess, isOfferPreset = false }) => {
  const isEdit = Boolean(productId);

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', originalPrice: '',
    category: '', subcategoryId: '', isFlagship: false, isOffer: isOfferPreset,
    isActive: true, inStock: true, sizes: [], images: [], giftBoxDetails: ''
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSubcategories();
      if (isEdit) fetchProduct();
      else setFormData({
        name: '', description: '', price: '', originalPrice: '',
        category: categories.length > 0 ? categories[0].name : '', subcategoryId: '', isFlagship: false, isOffer: isOfferPreset,
        isActive: true, inStock: true, sizes: [], images: [], giftBoxDetails: ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isOpen]);

  const fetchCategories = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
    if (!isEdit && data.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: data[0].name }));
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data } = await api.get('/subcategories');
      setSubcategories(data);
    } catch (err) { console.error(err); }
  };

  const fetchProduct = async () => {
    const { data } = await api.get(`/products/${productId}`);
    setFormData(data);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddSize = () => setFormData(prev => ({
    ...prev, sizes: [...prev.sizes, { size: '', order: prev.sizes.length }]
  }));
  const handleSizeChange = (index, value) => {
    const s = [...formData.sizes]; s[index].size = value;
    setFormData({ ...formData, sizes: s });
  };
  const handleRemoveSize = (index) => setFormData(prev => ({
    ...prev, sizes: prev.sizes.filter((_, i) => i !== index)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (isEdit) { await api.put(`/products/${productId}`, formData); }
      else { await api.post('/products', formData); }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Error saving product. Please try again.');
    } finally { setSaving(false); }
  };



  const sectionStyle = {
    background: '#141419', border: '1px solid #1e1e28',
    borderRadius: 16, padding: '28px 32px', marginBottom: 20,
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#0b0b0e', width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, border: '1px solid #1e1e28', padding: '32px 40px', position: 'relative' }} className="no-scrollbar">
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: '#8a8aa0', cursor: 'pointer' }}><X size={24} /></button>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p style={{ color: '#4a4a60', fontSize: '0.85rem', marginTop: 6 }}>
            {isEdit ? 'Update product details and variations' : 'List a new item in your store'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 24px', fontSize: '0.8rem', color: '#4a4a60', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Basic Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {field('Product Name',
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Gold Plated Bangle Set" className="admin-input" />
              )}
              {field('Description',
                <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} placeholder="Describe this product..." className="admin-input" style={{ resize: 'vertical' }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {field('Price (₹)',
                  <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="999" className="admin-input" />
                )}
                {field('Original Price (₹)', 
                  <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="1499 (optional)" className="admin-input" />,
                  'Shows as strikethrough to display discount'
                )}
              </div>
            </div>
          </div>

          {/* Category */}
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 24px', fontSize: '0.8rem', color: '#4a4a60', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Category
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {field('Main Category',
                <select name="category" value={formData.category} onChange={handleChange} className="admin-input">
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              )}
              
              {formData.category === 'artifical flowers' && field('Subcategory',
                <select name="subcategoryId" value={formData.subcategoryId || ''} onChange={handleChange} className="admin-input">
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              )}
            </div>
            
            {formData.category === 'Gift box combo' && (
              <div style={{ marginTop: 20 }}>
                {field('Gift Box Included Items & Details',
                  <textarea name="giftBoxDetails" required rows="3" value={formData.giftBoxDetails || ''} onChange={handleChange} placeholder="List items included in the gift box combo..." className="admin-input" style={{ resize: 'vertical' }} />
                )}
              </div>
            )}
          </div>

          {/* Bangle Sizes */}
          {(formData.category || '').toLowerCase().includes('bangles') && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#4a4a60', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Bangle Sizes
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#3a3a50', marginTop: 4 }}>Customers must select a size before adding to cart</p>
                </div>
                <button type="button" onClick={handleAddSize} className="btn-primary">
                  <Plus size={14} /> Add Size
                </button>
              </div>
              {formData.sizes.length === 0
                ? <p style={{ color: '#3a3a50', fontSize: '0.85rem', fontStyle: 'italic' }}>No sizes added. Customers won't be able to purchase this product until sizes are specified.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {formData.sizes.map((sizeObj, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px', border: '1px solid #1e1e28' }}>
                        <span style={{ color: '#3a3a50', fontWeight: 600, width: 24, fontSize: '0.85rem' }}>{idx + 1}.</span>
                        <input type="text" value={sizeObj.size} onChange={e => handleSizeChange(idx, e.target.value)} placeholder="e.g. 2.4" required className="admin-input" style={{ maxWidth: 140 }} />
                        <button type="button" onClick={() => handleRemoveSize(idx)} className="btn-danger" style={{ marginLeft: 'auto' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* Images */}
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 20px', fontSize: '0.8rem', color: '#4a4a60', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Product Images
            </h3>
            <p style={{ color: '#3a3a50', fontSize: '0.85rem', marginBottom: 16 }}>
              Paste Cloudinary or any public image URLs below. The first image will be used as the cover.
            </p>
            {(formData.images || []).map((img, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input
                  type="url"
                  value={img.url || ''}
                  onChange={e => {
                    const imgs = [...formData.images];
                    imgs[idx] = { ...imgs[idx], url: e.target.value };
                    setFormData({ ...formData, images: imgs });
                  }}
                  placeholder="https://res.cloudinary.com/..."
                  className="admin-input"
                />
                <button type="button" onClick={() => {
                  setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) });
                }} className="btn-danger">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setFormData({ ...formData, images: [...(formData.images || []), { url: '', publicId: '' }] })} className="btn-secondary" style={{ marginTop: 4 }}>
              + Add Image URL
            </button>
          </div>

          {/* Settings */}
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 20px', fontSize: '0.8rem', color: '#4a4a60', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { name: 'isFlagship', label: '★ Flagship Product', desc: 'Showcases in the homepage carousel' },
                { name: 'isOffer', label: '🎁 Special Offer', desc: 'Displays in the special offers section' },
                { name: 'isActive', label: '● Active (Visible on store)', desc: 'Hidden products won\'t appear to customers' },
                { name: 'inStock', label: '✓ In Stock', desc: 'If turned off, shows as Out of Stock and disables Add to Cart' },
              ].map(({ name, label, desc }) => (
                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  <div style={{ position: 'relative', width: 42, height: 24, flexShrink: 0 }}>
                    <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                    <div style={{
                      width: 42, height: 24, borderRadius: 999, cursor: 'pointer',
                      background: formData[name] ? 'linear-gradient(135deg, #FF1493, #8A2BE2)' : '#1e1e28',
                      transition: 'background 0.25s',
                      position: 'relative',
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, [name]: !prev[name] }))}>
                      <div style={{
                        position: 'absolute', top: 3, left: formData[name] ? 21 : 3,
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.25s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#d4d4e8', fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                    <div style={{ color: '#4a4a60', fontSize: '0.78rem' }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ minWidth: 140, justifyContent: 'center' }}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProductModal;
