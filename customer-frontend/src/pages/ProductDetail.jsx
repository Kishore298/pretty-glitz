import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Share2,
  Maximize2,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  Ruler,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import CollectionProductDetailCard from '../components/CollectionProductDetailCard';
import LotusDivider from '../components/LotusDivider';
import ProductDescriptionDisplay from '../components/ProductDescriptionDisplay';
import BangleSizeChartModal from '../components/BangleSizeChartModal';
import ProductImageModal from '../components/ProductImageModal';
import ColorVariationSelector from '../components/ColorVariationSelector';
import logoImg from '../assets/pretty-glitz-logo.png';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');

  // Variation States
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedPieceCount, setSelectedPieceCount] = useState(null);
  const [activeCustomImage, setActiveCustomImage] = useState(null);

  const [error, setError] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Accordion States (Collapsed by default as required)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const { addToCart, updateQuantity, removeFromCart, getCartItemQuantity, isInCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    setActiveCustomImage(null);
    setSelectedColor(null);
    setSelectedSize(null);
    fetchProduct();
    // Instantly reset scroll to top without visible smooth scrolling animation
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (err) {
      window.scrollTo(0, 0);
    }
    const raf = requestAnimationFrame(() => {
      html.style.scrollBehavior = prevBehavior;
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);

      // Handle Color Variants: Showcase image is default for designer bangles!
      // Do NOT pre-select color variant on initial load.
      if (data.colorVariants && data.colorVariants.length > 0) {
        setSelectedColor(null);
        setSelectedSize(null);
      } else if (data.sizes?.length > 0) {
        const firstInStock = data.sizes.find(s => s.inStock !== false);
        setSelectedSize(firstInStock ? firstInStock.size : data.sizes[0].size);
      }

      // Auto-select lowest piece count
      if (data.pieceCounts?.length > 0) {
        const sorted = [...data.pieceCounts].sort((a, b) => a.count - b.count);
        setSelectedPieceCount(sorted[0]);
      }

      // Fetch related products (all other products in the same category)
      if (data.category) {
        const rel = await api.get(`/products?category=${encodeURIComponent(data.category)}`);
        setRelatedProducts(rel.data.filter(p => p._id !== data._id && p.isActive !== false));
      }

      // Fetch all products across all other categories to display all collections
      try {
        const allRes = await api.get('/products');
        const grouped = {};
        allRes.data.forEach(p => {
          if (!p.category || p.category === data.category || p._id === data._id || p.isActive === false) return;
          if (!grouped[p.category]) grouped[p.category] = [];
          grouped[p.category].push(p);
        });
        setProductsByCategory(grouped);
      } catch (e) {
        console.error('Error fetching discovery products:', e);
      }
    } catch (err) { console.error(err); }
  };

  // Combined gallery thumbnails: showcase images first, followed by each color variant's images
  const allGalleryThumbnails = React.useMemo(() => {
    if (!product) return [];
    const list = [];
    const seenUrls = new Set();

    // 1. Showcase images from product.images
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img, i) => {
        if (img?.url && !seenUrls.has(img.url)) {
          seenUrls.add(img.url);
          list.push({
            id: `showcase-${i}`,
            url: img.url,
            type: 'showcase',
            label: `Showcase Photo ${i + 1}`,
            colorVariant: null,
          });
        }
      });
    } else if (product.image && !seenUrls.has(product.image)) {
      seenUrls.add(product.image);
      list.push({
        id: 'showcase-main',
        url: product.image,
        type: 'showcase',
        label: 'Showcase Photo',
        colorVariant: null,
      });
    }

    // 2. Colour variant images
    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((cVar) => {
        if (Array.isArray(cVar.images)) {
          cVar.images.forEach((img, i) => {
            if (img?.url && !seenUrls.has(img.url)) {
              seenUrls.add(img.url);
              list.push({
                id: `color-${cVar._id || cVar.colorName}-${i}`,
                url: img.url,
                type: 'color',
                label: `${cVar.colorName} ${i > 0 ? `(${i + 1})` : ''}`.trim(),
                colorVariant: cVar,
              });
            }
          });
        }
      });
    }

    return list;
  }, [product]);

  // Current active main image: showcase image by default, or color specific image after selection
  const currentMainImageUrl = activeCustomImage
    || (selectedColor?.images?.[0]?.url)
    || (product?.images?.[0]?.url)
    || (product?.image)
    || logoImg;

  const handleThumbnailClick = (item) => {
    if (!item) return;
    setActiveCustomImage(item.url);
    if (item.type === 'color' && item.colorVariant) {
      setSelectedColor(item.colorVariant);
      if (item.colorVariant.sizes?.length > 0) {
        const stillValid = item.colorVariant.sizes.find(s => s.size === selectedSize && s.inStock !== false);
        if (!stillValid) {
          const firstInStock = item.colorVariant.sizes.find(s => s.inStock !== false);
          setSelectedSize(firstInStock ? firstInStock.size : item.colorVariant.sizes[0].size);
        }
      }
    } else if (item.type === 'showcase') {
      setSelectedColor(null);
    }
  };

  const activeSizes = (selectedColor && selectedColor.sizes?.length > 0)
    ? selectedColor.sizes
    : (product?.colorVariants?.[0]?.sizes?.length > 0
        ? product.colorVariants[0].sizes
        : (product?.sizes || []));

  // Resolved price (piece count price overrides product price)
  const resolvedPrice = selectedPieceCount ? selectedPieceCount.price : product?.price;
  const resolvedOriginalPrice = selectedPieceCount ? selectedPieceCount.originalPrice : product?.originalPrice;

  // Cart state for current variant
  const cartVariantQty = product ? getCartItemQuantity(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id) : 0;
  const variantInCart = product ? isInCart(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id) : false;

  const validate = () => {
    if (product?.colorVariants && product.colorVariants.length > 0 && !selectedColor) {
      setError('Please choose a colour to continue');
      return false;
    }
    if (activeSizes?.length > 0 && !selectedSize) {
      setError('Please select a size to continue');
      return false;
    }
    if (product?.pieceCounts?.length > 0 && !selectedPieceCount) {
      setError('Please select a piece count to continue');
      return false;
    }
    // Check if selected size in selected color is in stock
    if (selectedColor && selectedSize) {
      const match = selectedColor.sizes?.find(s => s.size === selectedSize);
      if (match && match.inStock === false) {
        setError(`Size ${selectedSize} in ${selectedColor.colorName} is out of stock.`);
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice, selectedColor);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleIncrease = () => {
    if (!validate()) return;
    if (variantInCart) {
      updateQuantity(product._id, selectedSize, cartVariantQty + 1, selectedPieceCount?.count ?? null);
    } else {
      addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice, selectedColor);
    }
  };

  const handleDecrease = () => {
    if (cartVariantQty <= 1) {
      removeFromCart(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id);
    } else {
      updateQuantity(product._id, selectedSize, cartVariantQty - 1, selectedPieceCount?.count ?? null);
    }
  };

  // General-Purpose Product Sharing with Web Share API and silent AbortError handling
  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | PrettyGlitz`,
      text: `Discover this handcrafted piece: ${product.name} on PrettyGlitz!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Silently ignore if user cancels the share dialog
        if (err.name === 'AbortError') return;
        // Non-abort failure -> fallback to clipboard
        fallbackCopyLink(shareData.url);
      }
    } else {
      fallbackCopyLink(shareData.url);
    }
  };

  const fallbackCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const handleColorSelect = (cVar) => {
    setSelectedColor(cVar);
    setActiveCustomImage(cVar?.images?.[0]?.url || null);
    if (cVar?.sizes?.length > 0) {
      const stillValid = cVar.sizes.find(s => s.size === selectedSize && s.inStock !== false);
      if (!stillValid) {
        const firstAvailable = cVar.sizes.find(s => s.inStock !== false);
        setSelectedSize(firstAvailable ? firstAvailable.size : cVar.sizes[0].size);
      }
    }
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
          <Link to={`/category/${encodeURIComponent(product.category)}`}>{product.category}</Link>
          {product.subcategoryId && (
            <>
              <ChevronRight size={14} className="separator" />
              <Link to={`/category/${encodeURIComponent(product.category)}?sub=${encodeURIComponent(product.subcategoryId?._id || product.subcategoryId)}`}>
                {product.subcategoryId.name || 'Collection'}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="separator" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
        </div>

        <div className="product-detail-layout">

          {/* ── Image Gallery (Showcase Default + Colour-Specific Selection + Thumbnail Strip) ── */}
          <div className="product-gallery-wrapper">
            <div
              className="product-gallery-main"
              onTouchStart={(e) => {
                setTouchEndX(null);
                setTouchStartX(e.targetTouches[0].clientX);
              }}
              onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (!touchStartX || !touchEndX || allGalleryThumbnails.length <= 1) return;
                const distance = touchStartX - touchEndX;
                const currentIdx = allGalleryThumbnails.findIndex(t => t.url === currentMainImageUrl);
                if (distance > 35) {
                  const nextIdx = (currentIdx + 1) % allGalleryThumbnails.length;
                  handleThumbnailClick(allGalleryThumbnails[nextIdx]);
                } else if (distance < -35) {
                  const nextIdx = (currentIdx - 1 + allGalleryThumbnails.length) % allGalleryThumbnails.length;
                  handleThumbnailClick(allGalleryThumbnails[nextIdx]);
                }
              }}
              style={{
                position: 'relative',
                touchAction: allGalleryThumbnails.length > 1 ? 'pan-y' : 'auto',
                width: '100%',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'default',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMainImageUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <img
                    src={currentMainImageUrl ? optimizeImageUrl(currentMainImageUrl, 1200) : logoImg}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = logoImg;
                      e.currentTarget.style.objectFit = 'contain';
                      e.currentTarget.style.padding = '40px';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: currentMainImageUrl ? 'cover' : 'contain',
                      display: 'block',
                      padding: 0,
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Desktop Hover Next/Prev Arrows */}
              {allGalleryThumbnails.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIdx = allGalleryThumbnails.findIndex(t => t.url === currentMainImageUrl);
                      const prevIdx = (currentIdx - 1 + allGalleryThumbnails.length) % allGalleryThumbnails.length;
                      handleThumbnailClick(allGalleryThumbnails[prevIdx]);
                    }}
                    aria-label="Previous photo"
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'rgba(10, 10, 16, 0.65)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.9)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.65)')}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIdx = allGalleryThumbnails.findIndex(t => t.url === currentMainImageUrl);
                      const nextIdx = (currentIdx + 1) % allGalleryThumbnails.length;
                      handleThumbnailClick(allGalleryThumbnails[nextIdx]);
                    }}
                    aria-label="Next photo"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'rgba(10, 10, 16, 0.65)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.9)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.65)')}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <button
                type="button"
                className="product-gallery-zoom-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(true);
                }}
                aria-label="Enlarge product image"
                title="Enlarge image"
              >
                <Maximize2 size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* ── Thumbnail Strip: Showcase & Colour Variant Images ── */}
            {allGalleryThumbnails.length > 1 && (
              <div
                className="product-gallery-thumbnails"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 14,
                  overflowX: 'auto',
                  padding: '4px 2px 8px',
                  scrollbarWidth: 'thin',
                }}
              >
                {allGalleryThumbnails.map((item, idx) => {
                  const isActive = item.url === currentMainImageUrl;
                  return (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => handleThumbnailClick(item)}
                      aria-label={`View ${item.label}`}
                      title={item.label}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 12,
                        overflow: 'hidden',
                        padding: 0,
                        border: isActive
                          ? '2px solid var(--accent, #C4386C)'
                          : '1.5px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: isActive
                          ? '0 4px 12px rgba(196, 56, 108, 0.28)'
                          : 'none',
                        opacity: isActive ? 1 : 0.72,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isActive ? 'scale(1.02)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.opacity = '0.72';
                      }}
                    >
                      <img
                        src={optimizeImageUrl(item.url, 140)}
                        alt={item.label}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
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
                    title="Share product"
                    aria-label="Share product"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Toast for copied link */}
              {copyToast && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10B981',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 8,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Product link copied to clipboard!
                </motion.div>
              )}

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

              {/* Colour Variation Selector with Expand/Collapse */}
              {product.colorVariants && product.colorVariants.length > 0 && (
                <ColorVariationSelector
                  colorVariants={product.colorVariants}
                  selectedColor={selectedColor}
                  onSelectColor={handleColorSelect}
                  fallbackImage={product.images?.[0]?.url}
                />
              )}

              {/* Bangle Size Selector with Live Stock Availability */}
              {activeSizes?.length > 0 && (
                <div className="product-detail-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="product-detail-label" style={{ margin: 0 }}>
                      Select Size
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--accent, #C4386C)',
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                        padding: 0,
                      }}
                    >
                      <Ruler size={14} /> Size Guide
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activeSizes.map((s, idx) => {
                      const isOutOfStock = s.inStock === false;
                      const isSelected = selectedSize === s.size;
                      return (
                        <button
                          key={idx}
                          disabled={isOutOfStock}
                          onClick={() => {
                            if (!isOutOfStock) {
                              setSelectedSize(s.size);
                              setError('');
                            }
                          }}
                          className="product-size-btn"
                          style={{
                            background: isOutOfStock
                              ? 'rgba(0,0,0,0.06)'
                              : isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                            color: isOutOfStock
                              ? 'var(--text-muted)'
                              : isSelected ? 'white' : 'var(--text)',
                            border: isSelected ? 'none' : '1px solid var(--border)',
                            boxShadow: isSelected ? '0 8px 20px rgba(196,56,108,0.4)' : 'none',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            textDecoration: isOutOfStock ? 'line-through' : 'none',
                            opacity: isOutOfStock ? 0.5 : 1,
                            position: 'relative',
                            minWidth: 46,
                          }}
                          title={isOutOfStock ? `${s.size} is currently out of stock` : `Select size ${s.size}`}
                        >
                          {s.size}
                        </button>
                      );
                    })}
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

              {/* Collapsible Sections for Details and Shipping (Collapsed by default) */}
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Accordion 1: Product Details & Specifications */}
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(!detailsOpen)}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                    }}
                  >
                    <span>Product Details & Specifications</span>
                    <motion.div
                      animate={{ rotate: detailsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {detailsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ paddingTop: 14 }}>
                            <ProductDescriptionDisplay description={product.description} />
                          </div>
                          {product.category?.toLowerCase() === 'gift box combo' && product.giftBoxDetails && (
                            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
                                Included Items
                              </h4>
                              <ProductDescriptionDisplay description={product.giftBoxDetails} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Accordion 2: Shipping & Returns */}
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShippingOpen(!shippingOpen)}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                    }}
                  >
                    <span>🚚 Shipping & Returns</span>
                    <motion.div
                      animate={{ rotate: shippingOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {shippingOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '14px 18px 18px', borderTop: '1px solid var(--border)' }}>
                          <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                            All-India delivery available. We take extreme care in packaging your products to ensure they arrive in perfect condition. Handcrafted pieces are dispatched within 2-3 business days.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                Other handcrafted designs from the {product.category} collection with complete details & specifications
              </p>
              <LotusDivider />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}>
              {relatedProducts.map((relProduct, idx) => (
                <motion.div
                  key={relProduct._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <CollectionProductDetailCard
                    product={relProduct}
                    isLast={idx === relatedProducts.length - 1}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cross-Category Discovery: More to Explore Across Collections ── */}
        {Object.keys(productsByCategory).length > 0 && (
          <div className="product-related-section" style={{ marginTop: 64 }}>
            <div className="product-related-header">
              <h2 className="product-related-title">
                More to Explore Across Collections
              </h2>
              <p className="product-related-subtitle">
                Discover bespoke handcrafted jewellery across all our atelier collections
              </p>
            </div>

            {/* Category Filter Tab Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 16,
              marginBottom: 32,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              <button
                type="button"
                onClick={() => setActiveCategoryTab('ALL')}
                className={`category-tab-pill ${activeCategoryTab === 'ALL' ? 'active' : ''}`}
              >
                ✨ All Collections ({Object.values(productsByCategory).reduce((acc, curr) => acc + curr.length, 0)})
              </button>
              {Object.keys(productsByCategory).map(catName => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setActiveCategoryTab(catName)}
                  className={`category-tab-pill ${activeCategoryTab === catName ? 'active' : ''}`}
                >
                  {catName} ({productsByCategory[catName].length})
                </button>
              ))}
            </div>

            {/* Products Grid for Selected Category Tab */}
            <div className="product-grid-4">
              {(activeCategoryTab === 'ALL'
                ? Object.values(productsByCategory).flat()
                : productsByCategory[activeCategoryTab] || []
              ).map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bangle Sizing Chart Modal */}
      <BangleSizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
      />

      {/* Enlarged Product Image Lightbox Modal */}
      <ProductImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        product={product}
        images={allGalleryThumbnails.length > 0 ? allGalleryThumbnails : (product.images || [])}
        initialIndex={Math.max(0, allGalleryThumbnails.findIndex(t => t.url === currentMainImageUrl))}
      />
    </div>
  );
};

export default ProductDetail;
