import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { Check, ChevronRight, Share2, ZoomIn, Plus, Minus, ShoppingBag, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import logoImg from '../assets/pretty-glitz-logo.png';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [discoveryProducts, setDiscoveryProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedPieceCount, setSelectedPieceCount] = useState(null);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { addToCart, updateQuantity, removeFromCart, getCartItemQuantity, isInCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);

      // Auto-select lowest piece count
      if (data.pieceCounts?.length > 0) {
        const sorted = [...data.pieceCounts].sort((a, b) => a.count - b.count);
        setSelectedPieceCount(sorted[0]);
      }

      // Fetch related products (same category / subcategory)
      if (data.category) {
        const rel = await api.get(`/products?category=${encodeURIComponent(data.category)}`);
        setRelatedProducts(rel.data.filter(p => p._id !== data._id).slice(0, 4));
      }

      // Fetch cross-category discovery products
      try {
        const allRes = await api.get('/products');
        const cross = allRes.data.filter(p => p.category !== data.category && p._id !== data._id);
        setDiscoveryProducts(cross.slice(0, 4));
      } catch (e) {
        console.error('Error fetching discovery products:', e);
      }
    } catch (err) { console.error(err); }
  };

  // Resolved price (piece count price overrides product price)
  const resolvedPrice = selectedPieceCount ? selectedPieceCount.price : product?.price;
  const resolvedOriginalPrice = selectedPieceCount ? selectedPieceCount.originalPrice : product?.originalPrice;

  // Cart state for current variant
  const cartVariantQty = product ? getCartItemQuantity(product._id, selectedSize, selectedPieceCount?.count ?? null) : 0;
  const variantInCart = product ? isInCart(product._id, selectedSize, selectedPieceCount?.count ?? null) : false;

  const validate = () => {
    if ((product.category || '').toLowerCase().includes('bangles') && product.sizes?.length > 0 && !selectedSize) {
      setError('Please select a size to continue');
      return false;
    }
    if (product.pieceCounts?.length > 0 && !selectedPieceCount) {
      setError('Please select a piece count to continue');
      return false;
    }
    setError('');
    return true;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleIncrease = () => {
    if (!validate()) return;
    if (variantInCart) {
      updateQuantity(product._id, selectedSize, cartVariantQty + 1, selectedPieceCount?.count ?? null);
    } else {
      addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice);
    }
  };

  const handleDecrease = () => {
    if (cartVariantQty <= 1) {
      removeFromCart(product._id, selectedSize, selectedPieceCount?.count ?? null);
    } else {
      updateQuantity(product._id, selectedSize, cartVariantQty - 1, selectedPieceCount?.count ?? null);
    }
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

  const hasPieceCounts = product.pieceCounts?.length > 0;

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">

        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <div className="product-detail-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="separator" />
          <Link to={`/category/${product.category}`}>{product.category}</Link>
          <ChevronRight size={14} className="separator" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
        </div>

        <div className="product-detail-layout">

          {/* ── Image Gallery ──────────────────────────────────── */}
          <div className="product-gallery-wrapper">

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="product-gallery-thumbs no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className="product-gallery-thumb-btn"
                    style={{
                      border: `2px solid ${activeImage === idx ? 'var(--accent)' : 'transparent'}`,
                      opacity: activeImage === idx ? 1 : 0.6,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => { if (activeImage !== idx) e.currentTarget.style.opacity = 0.6; }}
                  >
                    <img
                      src={optimizeImageUrl(img.url, 150)}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = logoImg;
                        e.currentTarget.style.padding = '4px';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image with Zoom */}
            <div
              className="product-gallery-main"
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
                    src={product.images?.[activeImage]?.url ? optimizeImageUrl(product.images[activeImage].url, 1000) : logoImg}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = logoImg;
                      e.currentTarget.style.padding = '40px';
                    }}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      padding: product.images?.[activeImage]?.url ? 0 : '40px',
                      transform: isZoomed ? 'scale(2)' : 'scale(1)',
                      transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                      transition: isZoomed ? 'none' : 'transform 0.3s ease-out'
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {!isZoomed && (
                <div className="product-gallery-zoom-badge">
                  <ZoomIn size={16} />
                </div>
              )}
            </div>
          </div>

          {/* ── Product Info ───────────────────────────────────── */}
          <div className="product-info-wrapper">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              <div className="product-detail-header-row">
                <p className="product-detail-category">
                  {product.category}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => product && toggleWishlist(product)}
                    className="product-detail-share-btn"
                    title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    style={{
                      color: inWishlist ? '#E11D48' : 'var(--text-secondary)',
                      borderColor: inWishlist ? 'rgba(225,29,72,0.3)' : 'var(--border)',
                      background: inWishlist ? 'rgba(225,29,72,0.08)' : 'transparent',
                    }}
                  >
                    <Heart size={16} style={{ fill: inWishlist ? '#E11D48' : 'transparent', stroke: inWishlist ? '#E11D48' : 'currentColor' }} />
                  </button>

                  <button
                    onClick={handleShare}
                    className="product-detail-share-btn"
                    title="Share to WhatsApp"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              <h1 className="product-detail-title">
                {product.name}
              </h1>

              {/* Dynamic Price Display */}
              <div className="product-detail-price-row">
                <span className="product-detail-price">
                  ₹{resolvedPrice}
                </span>
                {resolvedOriginalPrice && (
                  <span className="product-detail-original-price">
                    ₹{resolvedOriginalPrice}
                  </span>
                )}
                {!product.inStock && (
                  <span className="product-detail-stock-badge">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Bangle Size Selector */}
              {(product.category || '').toLowerCase().includes('bangles') && product.sizes?.length > 0 && (
                <div className="product-detail-section">
                  <span className="product-detail-label">
                    Select Size
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedSize(s.size); setError(''); }}
                        className="product-size-btn"
                        style={{
                          background: selectedSize === s.size ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                          color: selectedSize === s.size ? 'white' : 'var(--text)',
                          border: selectedSize === s.size ? 'none' : `1px solid var(--border)`,
                          boxShadow: selectedSize === s.size ? '0 8px 20px rgba(196,56,108,0.4)' : 'none',
                        }}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Piece Count Selector */}
              {hasPieceCounts && (
                <div className="product-detail-section">
                  <span className="product-detail-label">
                    Piece Count
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...product.pieceCounts].sort((a, b) => a.count - b.count).map((pc, idx) => {
                      const isSelected = selectedPieceCount?.count === pc.count;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setSelectedPieceCount(pc); setError(''); }}
                          className="product-piece-btn"
                          style={{
                            background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                            color: isSelected ? 'white' : 'var(--text)',
                            border: isSelected ? 'none' : `1px solid var(--border)`,
                            boxShadow: isSelected ? '0 8px 20px rgba(196,56,108,0.4)' : 'none',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{pc.count} pcs</span>
                          <span style={{ opacity: isSelected ? 0.85 : 0.7 }}>₹{pc.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, marginBottom: 12 }}>{error}</motion.p>}

              {/* Cart Controls */}
              {product.inStock && (
                <div className="product-cart-section">
                  {variantInCart ? (
                    /* Quantity Stepper when variant is in cart */
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="product-cart-stepper">
                        <button onClick={handleDecrease} className="product-cart-stepper-btn">
                          <Minus size={16} />
                        </button>
                        <span className="product-cart-stepper-qty">
                          {cartVariantQty}
                        </span>
                        <button onClick={handleIncrease} className="product-cart-stepper-btn">
                          <Plus size={16} />
                        </button>
                      </div>
                      <Link to="/cart" className="product-view-cart-btn">
                        <ShoppingBag size={16} /> View Cart
                      </Link>
                    </div>
                  ) : (
                    /* Add to Cart */
                    <button
                      onClick={handleAddToCart}
                      className="product-add-cart-btn"
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(196,56,108,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,56,108,0.3)'; }}
                    >
                      {addedFeedback ? <><Check size={18} /> Added to Cart</> : 'Add to Cart'}
                    </button>
                  )}
                </div>
              )}

              {!product.inStock && (
                <div className="product-cart-section">
                  <button disabled className="product-add-cart-btn" style={{
                    background: 'var(--input-bg)', color: 'var(--text-muted)',
                    cursor: 'not-allowed', boxShadow: 'none'
                  }}>
                    Out of Stock
                  </button>
                </div>
              )}

              {/* Product Details Section */}
              <div className="product-details-accordion">
                <h3 className="product-details-heading">
                  Product Details
                </h3>
                <p className="product-details-body">
                  {product.description}
                </p>
                {product.category?.toLowerCase() === 'gift box combo' && product.giftBoxDetails && (
                  <>
                    <h3 className="product-details-heading" style={{ marginTop: 20 }}>
                      Included Items
                    </h3>
                    <p className="product-details-body">
                      {product.giftBoxDetails}
                    </p>
                  </>
                )}

                {/* Shipping info */}
                <div className="product-shipping-card">
                  <h4 className="product-shipping-title">
                    <span>🚚</span> Shipping & Returns
                  </h4>
                  <p className="product-shipping-text">
                    All-India delivery available. We take extreme care in packaging your products to ensure they arrive in perfect condition.
                  </p>
                </div>
              </div>

            </motion.div>
          </div>
        </div>

        {/* ── Same-Category & Subcategory Section: Complete Your Look ───── */}
        {relatedProducts.length > 0 && (
          <div className="product-related-section">
            <div className="product-related-header">
              <h2 className="product-related-title">
                Complete Your Look
              </h2>
              <p className="product-related-subtitle">
                Matching artisanal designs from the {product.category} collection
              </p>
            </div>

            <div className="product-grid-4">
              {relatedProducts.map((relProduct, idx) => (
                <motion.div key={relProduct._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <ProductCard product={relProduct} showVariants={true} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cross-Category Discovery: More to Explore ─────────── */}
        {discoveryProducts.length > 0 && (
          <div className="product-related-section" style={{ marginTop: 52 }}>
            <div className="product-related-header">
              <h2 className="product-related-title">
                More to Explore Across Collections
              </h2>
              <p className="product-related-subtitle">
                Discover handcrafted jewellery and bespoke accessories across our ateliers
              </p>
            </div>

            <div className="product-grid-4">
              {discoveryProducts.map((discProduct, idx) => (
                <motion.div key={discProduct._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <ProductCard product={discProduct} />
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
