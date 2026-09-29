import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Check } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { addToCart } = useContext(CartContext);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    } catch (err) { console.error(err); }
  };

  const handleAddToCart = () => {
    if ((product.category || '').toLowerCase().includes('bangles') && product.sizes?.length > 0 && !selectedSize) {
      setError('Please select a size to continue');
      return;
    }
    setError('');
    addToCart(product, selectedSize, quantity);
    
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: '#FF1493', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          {/* Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0" style={{ maxWidth: '100%' }}>
              {product.images?.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    flexShrink: 0, width: 80, height: 100, borderRadius: 12,
                    background: 'var(--bg-secondary)', border: `2px solid ${activeImage === idx ? '#FF1493' : 'transparent'}`,
                    overflow: 'hidden', cursor: 'pointer', padding: 0,
                    opacity: activeImage === idx ? 1 : 0.6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.6; }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 w-full" style={{ aspectRatio: '4/5', background: 'var(--bg-secondary)', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  src={product.images?.[activeImage]?.url} 
                  alt={product.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2 lg:pt-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p style={{ fontSize: '0.75rem', color: '#FF1493', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 12 }}>
                {product.category}
              </p>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text)', margin: '0 0 24px', lineHeight: 1.1 }}>
                {product.name}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 40 }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginBottom: 4 }}>
                    ₹{product.originalPrice}
                  </span>
                )}
                {!product.inStock && (
                  <span style={{
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                    padding: '4px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Bangle Size Selector */}
              {(product.category || '').toLowerCase().includes('bangles') && product.sizes?.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)' }}>
                      Select Size
                    </span>
                    <a href="/#" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Size Guide</a>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {product.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedSize(s.size); setError(''); }}
                        style={{
                          width: 56, height: 56, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                          background: selectedSize === s.size ? 'linear-gradient(135deg, #FF1493, #8A2BE2)' : 'transparent',
                          color: selectedSize === s.size ? 'white' : 'var(--text)',
                          border: selectedSize === s.size ? 'none' : `1px solid var(--border-strong)`,
                          boxShadow: selectedSize === s.size ? '0 8px 20px rgba(138,43,226,0.4)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, marginTop: 12 }}>{error}</motion.p>}
                </div>
              )}

              {/* Quantity & Add to Cart Row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 48, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', border: `1px solid var(--border-strong)`,
                  borderRadius: 12, width: 140, height: 56, background: 'transparent'
                }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>-</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>+</button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  style={{
                    flex: 1, height: 56, minWidth: 200,
                    background: !product.inStock ? 'var(--input-bg)' : (isDark ? '#fff' : '#0f0f12'),
                    color: !product.inStock ? 'var(--text-muted)' : (isDark ? '#000' : '#fff'),
                    border: 'none', borderRadius: 12,
                    fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: !product.inStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: (!product.inStock) ? 'none' : (isDark ? '0 8px 30px rgba(255,255,255,0.15)' : '0 8px 30px rgba(0,0,0,0.15)'),
                  }}
                  onMouseEnter={e => { if(product.inStock) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { if(product.inStock) e.currentTarget.style.transform = 'none' }}
                >
                  {!product.inStock ? 'Out of Stock' : (addedFeedback ? <><Check size={18} /> Added to Cart</> : 'Add to Cart')}
                </button>
              </div>

              <div style={{ borderTop: `1px solid var(--border)`, paddingTop: 32 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                  Product Details
                </h3>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  {product.description}
                </p>
                {product.category === 'Gift box combo' && product.giftBoxDetails && (
                  <>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 24, marginBottom: 16 }}>
                      Included Items
                    </h3>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                      {product.giftBoxDetails}
                    </p>
                  </>
                )}
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
