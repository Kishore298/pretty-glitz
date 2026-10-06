import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { Check, ChevronRight, Share2, ZoomIn } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      
      // Fetch related products from same category
      if (data.category) {
        const rel = await api.get(`/products?category=${encodeURIComponent(data.category)}`);
        setRelatedProducts(rel.data.filter(p => p._id !== data._id).slice(0, 4));
      }
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

  const handleShare = () => {
    const text = `Check out this beautiful ${product.name} on PrettyGlitz!`;
    const url = window.location.href;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        
        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="separator" />
          <Link to={`/category/${product.category}`}>{product.category}</Link>
          <ChevronRight size={14} className="separator" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mt-8">
          
          {/* ── Image Gallery ──────────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thumbnails */}
            <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0" style={{ maxWidth: '100%' }}>
              {product.images?.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    flexShrink: 0, width: 80, height: 100, borderRadius: 12,
                    background: 'var(--bg-secondary)', border: `2px solid ${activeImage === idx ? 'var(--accent)' : 'transparent'}`,
                    overflow: 'hidden', cursor: 'pointer', padding: 0,
                    opacity: activeImage === idx ? 1 : 0.6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.6; }}
                >
                  <img src={optimizeImageUrl(img.url, 150)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>

            {/* Main Image with Zoom */}
            <div 
              className="flex-1 w-full" 
              style={{ aspectRatio: '4/5', background: 'var(--bg-secondary)', borderRadius: 20, overflow: 'hidden', position: 'relative', cursor: 'crosshair' }}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeImage}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <img 
                    src={optimizeImageUrl(product.images?.[activeImage]?.url, 1000)} 
                    alt={product.name} 
                    style={{ 
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: isZoomed ? 'scale(2)' : 'scale(1)',
                      transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                      transition: isZoomed ? 'none' : 'transform 0.3s ease-out'
                    }} 
                  />
                </motion.div>
              </AnimatePresence>
              
              {!isZoomed && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.9)', color: '#000', padding: 8, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <ZoomIn size={18} />
                </div>
              )}
            </div>
          </div>

          {/* ── Product Info ───────────────────────────────────── */}
          <div className="w-full lg:w-1/2 lg:pt-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 12 }}>
                  {product.category}
                </p>
                
                <button 
                  onClick={handleShare}
                  style={{ background: 'var(--bg-secondary)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}
                  title="Share to WhatsApp"
                >
                  <Share2 size={18} />
                </button>
              </div>

              <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 600, color: 'var(--text)', margin: '0 0 24px', lineHeight: 1.1 }}>
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
                          background: selectedSize === s.size ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                          color: selectedSize === s.size ? 'white' : 'var(--text)',
                          border: selectedSize === s.size ? 'none' : `1px solid var(--border)`,
                          boxShadow: selectedSize === s.size ? '0 8px 20px rgba(196,56,108,0.4)' : 'none',
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
                  borderRadius: 12, width: 140, height: 56, background: 'var(--bg-secondary)'
                }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>-</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>+</button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  style={{
                    flex: 1, height: 56, minWidth: 200,
                    background: !product.inStock ? 'var(--input-bg)' : 'var(--accent-gradient)',
                    color: !product.inStock ? 'var(--text-muted)' : 'white',
                    border: 'none', borderRadius: 12,
                    fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: !product.inStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: (!product.inStock) ? 'none' : '0 8px 30px rgba(196,56,108,0.3)',
                  }}
                  onMouseEnter={e => { if(product.inStock) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(196,56,108,0.4)'; } }}
                  onMouseLeave={e => { if(product.inStock) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,56,108,0.3)'; } }}
                >
                  {!product.inStock ? 'Out of Stock' : (addedFeedback ? <><Check size={18} /> Added to Cart</> : 'Add to Cart')}
                </button>
              </div>

              {/* Product Details Section */}
              <div style={{ borderTop: `1px solid var(--border)`, paddingTop: 32 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                  Product Details
                </h3>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  {product.description}
                </p>
                {product.category?.toLowerCase() === 'gift box combo' && product.giftBoxDetails && (
                  <>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 32, marginBottom: 16 }}>
                      Included Items
                    </h3>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                      {product.giftBoxDetails}
                    </p>
                  </>
                )}
                
                {/* Shipping info */}
                <div style={{ marginTop: 32, padding: 20, borderRadius: 12, background: 'var(--bg-secondary)', border: `1px solid var(--border)` }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--accent-gold)' }}>🚚</span> Shipping & Returns
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    All-India delivery available. We take extreme care in packaging your products to ensure they arrive in perfect condition.
                  </p>
                </div>
              </div>

            </motion.div>
          </div>
        </div>

        {/* ── Related Products ─────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: 100, borderTop: `1px solid var(--border)`, paddingTop: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600,
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text)', margin: 0,
              }}>
                You May Also Like
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '0.95rem' }}>
                Explore more from the {product.category} collection
              </p>
            </div>
            
            <div className="product-grid-4">
              {relatedProducts.map((relProduct, idx) => (
                <motion.div key={relProduct._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <ProductCard product={relProduct} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;
