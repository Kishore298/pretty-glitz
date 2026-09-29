import React, { useState, useEffect } from 'react';
import { Plus, Tag } from 'lucide-react';
import api from '../utils/api';
import AddEditProductModal from '../components/AddEditProductModal';
import Sidebar from '../components/Sidebar';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

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

  const handleMakeOffer = async (productId, newPrice, currentPrice) => {
    try {
      await api.put(`/products/${productId}`, {
        price: newPrice,
        originalPrice: currentPrice,
        isOffer: true
      });
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0b0e' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', margin: '0 0 8px' }}>
              Special Offers
            </h1>
            <p style={{ color: '#8a8aa0', fontSize: '0.9rem', margin: 0 }}>
              Manage discounted products and featured offers
            </p>
          </div>
        <button 
          onClick={() => { setEditingProductId(null); setIsModalOpen(true); }}
          className="admin-btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} /> Add Custom Offer
        </button>
      </div>

      <div style={{ background: '#141419', border: '1px solid #1e1e28', borderRadius: 16, padding: 32, marginBottom: 40 }}>
        <h3 style={{ margin: '0 0 20px', color: '#f0f0f5' }}>Convert Existing Product to Offer</h3>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar">
          {products.filter(p => !p.isOffer).map(p => (
            <div key={p._id} style={{ minWidth: 250, background: '#1e1e28', padding: 16, borderRadius: 12 }}>
              <h4 style={{ margin: '0 0 8px', color: '#f0f0f5', fontSize: '0.9rem' }}>{p.name}</h4>
              <p style={{ margin: '0 0 16px', color: '#8a8aa0', fontSize: '0.8rem' }}>Current: ₹{p.price}</p>
              
              <button 
                onClick={() => {
                  const val = window.prompt(`Enter discounted price for ${p.name}:`);
                  if (val && !isNaN(val)) {
                    handleMakeOffer(p._id, Number(val), p.price);
                  }
                }}
                className="admin-btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
              >
                Create Offer
              </button>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#f0f0f5', marginBottom: 24 }}>
        Active Offers
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {offerProducts.map(product => (
          <div key={product._id} style={{ background: '#141419', border: '1px solid #1e1e28', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,20,147,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF1493' }}>
                <Tag size={24} />
              </div>
              <button onClick={() => handleRemoveOffer(product)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                Remove Offer
              </button>
            </div>
            
            <h3 style={{ margin: '0 0 8px', color: '#f0f0f5', fontSize: '1.1rem', fontWeight: 600 }}>
              {product.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FF1493' }}>₹{product.price}</span>
              {product.originalPrice && (
                <span style={{ fontSize: '0.9rem', color: '#8a8aa0', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
              )}
            </div>
          </div>
        ))}
        {offerProducts.length === 0 && (
          <div style={{ color: '#8a8aa0', gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: '#141419', borderRadius: 16, border: '1px dashed #1e1e28' }}>
            No active offers.
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
    </div>
  );
};

export default Offers;
