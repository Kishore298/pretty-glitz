import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext, resolveStock, isColorCompletelyOutOfStock } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
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
import SwipeGalleryStage from '../components/SwipeGalleryStage';
import ColorVariationSelector from '../components/ColorVariationSelector';
import { sortSizesAscending, getBangleSizeParts } from '../utils/sizeHelper';
import { slugify } from '../utils/urlHelper';
import logoImg from '../assets/pretty-glitz-logo.png';

const ProductDetail = () => {
  const { isDark } = useTheme();
  const { id } = useParams();
  const location = useLocation();
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
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Accordion States: Specifications expanded by default on ProductDetail; Shipping collapsed
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const { cartItems, addToCart, updateQuantity, removeFromCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    setActiveCustomImage(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setActiveCustomImage(null);
    setError('');
    fetchProduct();
    const hasRestoreState = Boolean(
      location.state?.restoreScrollY !== undefined ||
      window.history.state?.usr?.restoreScrollY !== undefined
    );
    if (!hasRestoreState) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${encodeURIComponent(id)}`);
      setProduct(data);

      // If accessed via MongoDB ObjectId, smoothly update the URL to friendly product slug
      if (data?.name && /^[0-9a-fA-F]{24}$/.test(id)) {
        const slug = slugify(data.name);
        if (slug) {
          window.history.replaceState(null, '', `/product/${slug}`);
        }
      }

      // Keep color and size initially unselected per user instruction.
      // Size must always be selected manually by the user, for both products with and without color variants.
      setSelectedColor(null);
      setSelectedSize(null);
      setError('');

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

    // 2. Colour variant images (exclude completely out of stock colorways)
    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((cVar) => {
        if (isColorCompletelyOutOfStock(cVar)) return;
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

  // Available in-stock colour variations
  const availableColorVariants = React.useMemo(() => {
    return (product?.colorVariants || []).filter((cVar) => !isColorCompletelyOutOfStock(cVar));
  }, [product?.colorVariants]);

  // Current active main image: showcase main image ALWAYS by default, or color specific image after selection
  const currentMainImageUrl = activeCustomImage
    || (product?.images?.[0]?.url)
    || (product?.image)
    || (!isColorCompletelyOutOfStock(selectedColor) && selectedColor?.images?.[0]?.url)
    || logoImg;

  const handleThumbnailClick = (item) => {
    if (!item) return;
    setActiveCustomImage(item.url);
    if (item.type === 'color' && item.colorVariant) {
      if (isColorCompletelyOutOfStock(item.colorVariant)) return;
      setSelectedColor(item.colorVariant);
      setError('');
      if (selectedSize && item.colorVariant.sizes?.length > 0) {
        const stillValid = item.colorVariant.sizes.find(s => s.size === selectedSize && s.inStock !== false);
        if (!stillValid) {
          setSelectedSize(null);
        }
      }
    } else if (item.type === 'showcase') {
      setSelectedColor(null);
    }
  };

  const activeSizes = sortSizesAscending(
    (selectedColor && !isColorCompletelyOutOfStock(selectedColor) && selectedColor.sizes?.length > 0)
      ? selectedColor.sizes
      : (availableColorVariants?.[0]?.sizes?.length > 0
        ? availableColorVariants[0].sizes
        : (product?.sizes || []))
  );

  // Resolved price (piece count price overrides product price)
  const resolvedPrice = selectedPieceCount ? selectedPieceCount.price : product?.price;
  const resolvedOriginalPrice = selectedPieceCount ? selectedPieceCount.originalPrice : product?.originalPrice;
  const discountPercent = (resolvedOriginalPrice && resolvedPrice && resolvedOriginalPrice > resolvedPrice)
    ? Math.round(((resolvedOriginalPrice - resolvedPrice) / resolvedOriginalPrice) * 100)
    : 0;

  // Strict Cart Variant Matching: Stepper and "View Cart" only display when the exact variant matches
  const hasColors = Boolean(product?.colorVariants && product.colorVariants.length > 0);
  const hasSizes = Boolean(activeSizes && activeSizes.length > 0);
  const hasPieceCounts = Boolean(product?.pieceCounts && product.pieceCounts.length > 0);
  const isSelectionComplete = (!hasColors || selectedColor) && (!hasSizes || selectedSize);

  const matchedCartItem = React.useMemo(() => {
    if (!product || !isSelectionComplete) return null;
    return (cartItems || []).find((i) => {
      const pId = (typeof i.product === 'object' ? i.product?._id : i.product)?.toString();
      if (pId !== product._id?.toString()) return false;

      if (hasColors) {
        const itemColorId = i.colorVariantId ? i.colorVariantId.toString() : null;
        const curColorId = selectedColor?._id ? selectedColor._id.toString() : null;
        if (itemColorId && curColorId) {
          if (itemColorId !== curColorId) return false;
        } else if (i.colorName && selectedColor?.colorName) {
          if (i.colorName.toLowerCase() !== selectedColor.colorName.toLowerCase()) return false;
        } else if (itemColorId !== curColorId) {
          return false;
        }
      }

      if (hasSizes) {
        if (i.size !== selectedSize) return false;
      }

      if (hasPieceCounts) {
        if (i.pieceCount !== (selectedPieceCount?.count ?? null)) return false;
      }

      return true;
    });
  }, [product, isSelectionComplete, cartItems, hasColors, selectedColor, hasSizes, selectedSize, hasPieceCounts, selectedPieceCount]);

  const variantInCart = Boolean(matchedCartItem);
  const cartVariantQty = matchedCartItem ? matchedCartItem.quantity : 0;

  // Authoritative stock evaluation for current variant (Scenario A & B)
  const stockInfo = resolveStock(product, selectedSize, selectedColor);
  const isOutOfStock = !product?.inStock || !stockInfo.isAvailable;
  const isMaxReached = stockInfo.isStockTracked && cartVariantQty >= stockInfo.availableStock;

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
    if (isOutOfStock) {
      setError(stockInfo.reason || 'This product/variant is currently out of stock.');
      return false;
    }
    if (isMaxReached) {
      setError(`Maximum stock of ${stockInfo.availableStock} reached for this item.`);
      return false;
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
    if (isMaxReached) {
      setError(`Only ${stockInfo.availableStock} available in stock.`);
      return;
    }
    if (variantInCart) {
      updateQuantity(product._id, selectedSize, cartVariantQty + 1, selectedPieceCount?.count ?? null, selectedColor?._id);
    } else {
      addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice, selectedColor);
    }
  };

  const handleDecrease = () => {
    if (cartVariantQty <= 1) {
      removeFromCart(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id);
    } else {
      updateQuantity(product._id, selectedSize, cartVariantQty - 1, selectedPieceCount?.count ?? null, selectedColor?._id);
    }
  };

  // General-Purpose Product Sharing with Web Share API and silent AbortError handling
  const handleShare = async () => {
    const slug = slugify(product?.name);
    const friendlyUrl = slug ? `${window.location.origin}/product/${slug}` : window.location.href;
    const shareData = {
      title: `${product.name} | PrettyGlitz`,
      text: `Discover this handcrafted piece: ${product.name} on PrettyGlitz!`,
      url: friendlyUrl,
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
    setError('');
    if (selectedSize && cVar?.sizes?.length > 0) {
      const stillValid = cVar.sizes.find(s => s.size === selectedSize && s.inStock !== false);
      if (!stillValid) {
        setSelectedSize(null);
      }
    }
  };

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }} />
    </div>
  );

  const handleGalleryClick = () => {
    setIsImageModalOpen(true);
  };

  const currentGalleryIndex = Math.max(0, allGalleryThumbnails.findIndex(t => t.url === currentMainImageUrl));

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">

        {/* ── Breadcrumb Pill (Category & Subcategory Only) ────────────────── */}
        <div className="product-detail-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={11} className="separator" />
          <Link to={`/category/${encodeURIComponent(product.category)}`}>{product.category}</Link>
          {product.subcategoryId && (
            <>
              <ChevronRight size={11} className="separator" />
              <Link to={`/category/${encodeURIComponent(product.category)}/${encodeURIComponent(product.subcategoryId.name || 'Collection')}`}>
                {product.subcategoryId.name || 'Collection'}
              </Link>
            </>
          )}
        </div>

        <div className="product-detail-layout">

          {/* ── Image Gallery (Showcase Default + Colour-Specific Selection) ── */}
          <div className="product-gallery-wrapper">
            <SwipeGalleryStage
              className="product-gallery-main product-detail-gallery-main"
              images={allGalleryThumbnails}
              activeIndex={currentGalleryIndex}
              onIndexChange={(idx) => {
                if (allGalleryThumbnails[idx]) {
                  handleThumbnailClick(allGalleryThumbnails[idx]);
                }
              }}
              onStageClick={handleGalleryClick}
              alt={product.name}
              imageWidth={1200}
              priority
              borderRadius={5}
              hasCornerButton
              style={{
                width: '100%',
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              {/* Desktop Hover Next/Prev Arrows */}
              {allGalleryThumbnails.length > 1 && (
                <>
                  <button
                    type="button"
                    className="product-gallery-nav-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIdx = (currentGalleryIndex - 1 + allGalleryThumbnails.length) % allGalleryThumbnails.length;
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
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 6,
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.9)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.65)')}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    className="product-gallery-nav-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = (currentGalleryIndex + 1) % allGalleryThumbnails.length;
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
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 6,
                      transition: 'background-color 0.2s ease',
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
            </SwipeGalleryStage>
          </div>

          {/* ── Product Info ───────────────────────────────────── */}
          <div className="product-info-wrapper">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

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
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Product link copied to clipboard!
                </motion.div>
              )}

              {/* Product Title Row: Title on Left, Wishlist Heart & Share Buttons on Right */}
              <div className="product-detail-title-row">
                <h1 className="product-detail-title">
                  {product.name}
                </h1>

                <div className="product-detail-actions-group">
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
                    <Heart
                      size={16}
                      style={{
                        fill: inWishlist ? '#E11D48' : 'rgba(255, 255, 255, 0.65)',
                        stroke: inWishlist ? '#E11D48' : (isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(35, 28, 33, 0.65)'),
                        strokeWidth: 1.6,
                      }}
                    />
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

              {/* Dynamic Price Display */}
              <div className="product-detail-price-row">
                <span className="product-detail-price">
                  ₹{resolvedPrice}
                </span>
                {resolvedOriginalPrice && resolvedOriginalPrice > resolvedPrice && (
                  <span className="product-detail-original-price">
                    ₹{resolvedOriginalPrice}
                  </span>
                )}
                {discountPercent > 0 && resolvedOriginalPrice && resolvedOriginalPrice > resolvedPrice && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#C4386C',
                      background: 'rgba(196,56,108,0.1)',
                      padding: '2px 9px',
                      borderRadius: 6,
                      alignSelf: 'center',
                    }}
                  >
                    Save ₹{resolvedOriginalPrice - resolvedPrice}
                  </span>
                )}
                {product.packagingType && (
                  <span
                    className="product-detail-packaging-type"
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      fontFamily: 'Outfit, sans-serif',
                      alignSelf: 'center',
                    }}
                  >
                    ({(() => {
                      const qty = product.packagingQuantity && Number(product.packagingQuantity) > 0 ? Number(product.packagingQuantity) : 1;
                      const unit = (product.packagingType || '').trim();
                      const lower = unit.toLowerCase();
                      if (lower === 'set') return `${qty} ${qty > 1 ? 'Sets' : 'Set'}`;
                      if (lower === 'dozen') return `${qty} Dozen`;
                      if (lower === 'pieces' || lower === 'piece') return `${qty} ${qty === 1 ? 'Piece' : 'Pieces'}`;
                      if (lower === 'pair' || lower === 'pairs') return `${qty} ${qty === 1 ? 'Pair' : 'Pairs'}`;
                      if (lower === 'pack' || lower === 'packs') return `${qty} ${qty === 1 ? 'Pack' : 'Packs'}`;
                      if (lower === 'box' || lower === 'boxes') return `${qty} ${qty === 1 ? 'Box' : 'Boxes'}`;
                      return `${qty} ${unit}`;
                    })()})
                  </span>
                )}
                {!product.inStock && (
                  <span className="product-detail-stock-badge">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Bangle Size Selector with Live Stock Availability (Positioned directly below price) */}
              {activeSizes?.length > 0 && (!hasColors || selectedColor) && (
                <div className="product-detail-section product-size-section">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        letterSpacing: '-0.01em',
                      }}
                    >
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
                        gap: 4,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--accent, #C4386C)',
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                        padding: '2px 4px',
                      }}
                    >
                      <Ruler size={13} /> Size Guide
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {activeSizes.map((s, idx) => {
                      const isOutOfStock = s.inStock === false;
                      const isSelected = selectedSize === s.size;
                      const { sizeNumber, cmRange } = getBangleSizeParts(s.size);
                      return (
                        <button
                          key={idx}
                          type="button"
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
                            border: isSelected ? '2px solid var(--accent, #C4386C)' : '1px solid var(--border)',
                            borderRadius: 10,
                            boxShadow: isSelected ? '0 4px 14px rgba(196,56,108,0.35)' : 'none',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            textDecoration: isOutOfStock ? 'line-through' : 'none',
                            opacity: isOutOfStock ? 0.5 : 1,
                            position: 'relative',
                          }}
                          title={isOutOfStock ? `${s.size} is currently out of stock` : `Select size ${s.size}`}
                        >
                          <span style={{ fontWeight: 700 }}>{sizeNumber}</span>
                          {cmRange && (
                            <span style={{ fontSize: '0.82em', fontWeight: 500, opacity: 0.9, marginLeft: 4 }}>
                              ({cmRange})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colour Variation Selector with Expand/Collapse */}
              {availableColorVariants && availableColorVariants.length > 0 && (
                <ColorVariationSelector
                  colorVariants={availableColorVariants}
                  selectedColor={selectedColor}
                  onSelectColor={handleColorSelect}
                  fallbackImage={product.images?.[0]?.url}
                />
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

              {/* Cart Controls with Live Stock Validation */}
              {!isOutOfStock ? (
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
                        <button
                          onClick={handleIncrease}
                          disabled={isMaxReached}
                          className="product-cart-stepper-btn"
                          style={{
                            opacity: isMaxReached ? 0.35 : 1,
                            cursor: isMaxReached ? 'not-allowed' : 'pointer',
                          }}
                          title={isMaxReached ? `Only ${stockInfo.availableStock} available` : 'Add one more'}
                        >
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
              ) : (
                <div className="product-cart-section">
                  <button
                    disabled
                    className="product-add-cart-btn"
                    style={{
                      background: '#374151',
                      color: '#9CA3AF',
                      cursor: 'not-allowed',
                      boxShadow: 'none',
                      opacity: 0.8,
                    }}
                  >
                    Out of Stock
                  </button>
                </div>
              )}

              {/* Collapsible Sections for Details and Shipping (Collapsed by default) */}
              <div className="product-accordions-group" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    className="product-accordion-btn"
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
                    className="product-accordion-btn"
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
              <h2 className="product-related-title complete-your-look-title">
                Complete Your Look
              </h2>
              <p className="product-related-subtitle">
                Other handcrafted designs from the {product.category} collection with complete details & specifications
              </p>
              <LotusDivider style={{ margin: '4px auto 6px' }} />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
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
          <div className="product-related-section" style={{ marginTop: 28, paddingTop: 24 }}>
            <div className="product-related-header" style={{ marginBottom: 14 }}>
              <h2 className="product-related-title">
                More to Explore Across Collections
              </h2>
              <p className="product-related-subtitle" style={{ marginTop: 4, marginBottom: 0 }}>
                Discover handcrafted bangles and timeless jewellery
              </p>
            </div>

            {/* Category Filter Tab Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              padding: '4px 4px 10px 4px',
              marginBottom: 16,
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
        onClose={(finalIdx) => {
          setIsImageModalOpen(false);
          if (typeof finalIdx === 'number' && allGalleryThumbnails[finalIdx]) {
            handleThumbnailClick(allGalleryThumbnails[finalIdx]);
          }
        }}
        product={product}
        images={allGalleryThumbnails.length > 0 ? allGalleryThumbnails : (product.images || [])}
        initialIndex={Math.max(0, allGalleryThumbnails.findIndex(t => t.url === currentMainImageUrl))}
        showViewDetails={false}
        aspectRatio="1 / 1"
        onImageChange={(newIdx) => {
          if (allGalleryThumbnails[newIdx]) {
            handleThumbnailClick(allGalleryThumbnails[newIdx]);
          }
        }}
      />
    </div>
  );
};

export default ProductDetail;
