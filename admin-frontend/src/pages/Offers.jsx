import React, { useState, useEffect } from 'react';
import { Plus, Tag, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import AddEditProductModal from '../components/AddEditProductModal';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
      setOfferProducts(data.filter(p => p.isOffer));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !discountPrice) return;
    
    const product = products.find(p => p._id === selectedProductId);
    if (!product) return;

    try {
      await api.put(`/products/${selectedProductId}`, {
        price: Number(discountPrice),
        originalPrice: product.price,
        isOffer: true
      });
      setSelectedProductId('');
      setDiscountPrice('');
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveOffer = async (product) => {
    try {
      await api.put(`/products/${product._id}`, {
        price: product.originalPrice || product.price,
        originalPrice: 0,
        isOffer: false
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const nonOfferProducts = products.filter(p => !p.isOffer);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Special Offers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Manage discounted products and featured offers
          </p>
        </div>
        <button 
          onClick={() => { setEditingProductId(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> Add Custom Offer
        </button>
      </div>

      <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 32, marginBottom: 40 }}>
        <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>Convert Existing Product to Offer</h3>
        <form onSubmit={handleMakeOffer} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 250 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="admin-input"
              required
            >
              <option value="">-- Choose a product --</option>
              {nonOfferProducts.map(p => (
                <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Offer Price (₹)</label>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="e.g. 499"
              className="admin-input"
              required
              min="0"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: 40 }}>
            Create Offer <ArrowRight size={16} />
          </button>
        </form>
      </div>

      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
        Active Offers
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {offerProducts.map(product => (
          <div key={product._id} style={{ 
            background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 24,
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(236,22,140,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-pink)' }}>
                <Tag size={24} />
              </div>
              <button onClick={() => handleRemoveOffer(product)} style={{ 
                background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              >
                Remove Offer
              </button>
            </div>
            
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-pink)' }}>₹{product.price}</span>
              {product.originalPrice && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 500 }}>₹{product.originalPrice}</span>
              )}
            </div>
          </div>
        ))}
        {offerProducts.length === 0 && (
          <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', padding: 60, textAlign: 'center', background: 'var(--surface-secondary)', borderRadius: 16, border: '1px dashed var(--card-border)', fontWeight: 500 }}>
            No active offers found.
          </div>
        )}
      </div>

      <AddEditProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={editingProductId}
        onSuccess={fetchProducts}
        isOfferPreset={true}
      />
    </div>
  );
};

export default Offers;
