import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';
const getBreakpoint = () => {
  const width = window.innerWidth;
  if (width <= 648) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
};

const Home = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [breakpoint, setBreakpoint] = useState(getBreakpoint());
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingBestsellers, setLoadingBestsellers] = useState(true);

  const collectionsRef = useRef(null);
  const bestsellersViewportRef = useRef(null);
  const bestsellersGroupRef = useRef(null);
  const carouselPauseUntilRef = useRef(0);
  const carouselTouchingRef = useRef(false);
  const carouselHoveringRef = useRef(false);

  useEffect(() => {
    fetchBestsellers();
    fetchOffers();
    fetchCategories();
    fetchBanners();
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const onResize = () => {
      setBreakpoint(getBreakpoint());
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchBestsellers = async () => {
    setLoadingBestsellers(true);
    try {
      const { data } = await api.get('/products?isBestseller=true');
      if (Array.isArray(data) && data.length > 0) {
        setBestsellers(data);
      } else {
        // Fallback to active products if none are explicitly tagged as bestseller
        const fallback = await api.get('/products');
        if (Array.isArray(fallback.data) && fallback.data.length > 0) {
          setBestsellers(fallback.data.slice(0, 8));
        } else {
          setBestsellers([]);
        }
      }
    } catch (err) {
      console.error('Error fetching bestsellers:', err);
      try {
        const fallback = await api.get('/products');
        if (Array.isArray(fallback.data)) {
          setBestsellers(fallback.data.slice(0, 8));
        }
      } catch (fallbackErr) {
        setBestsellers([]);
      }
    } finally {
      setLoadingBestsellers(false);
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const { data } = await api.get('/products?isOffer=true');
      setOffers(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCollections(true);
    try {
      const { data } = await api.get('/categories');
      setCollections(
        (Array.isArray(data) ? data : []).map((category) => ({
          name: category.name,
          bannerImage: category.bannerImage,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/banners');
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data } = await api.get('/testimonials');
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Keep one full product group on either side of the visible group so that
  // normalising scrollLeft never exposes an empty edge.
  const estimatedCardWidth = viewportWidth <= 648 ? Math.min(viewportWidth * 0.78, 280) : 280;
  const estimatedCardStep = estimatedCardWidth + (viewportWidth <= 648 ? 16 : 24);
  const minCardsPerGroup = 6;
  const copiesPerLoop = bestsellers.length
    ? Math.max(
        Math.ceil(minCardsPerGroup / bestsellers.length),
        Math.ceil((viewportWidth + 200) / (bestsellers.length * estimatedCardStep))
      )
    : 1;
  const carouselProducts = Array.from({ length: copiesPerLoop }, () => bestsellers).flat();

  // ── Best Sellers Carousel Normalisation & Auto-scroll every 2s ──────────
  useEffect(() => {
    if (loadingBestsellers || !bestsellers.length) return undefined;

    const viewport = bestsellersViewportRef.current;
    const firstGroup = bestsellersGroupRef.current;
    if (!viewport) return undefined;

    const getCardStep = () => {
      const card = viewport.querySelector('.best-sellers-card');
      const w = card ? card.offsetWidth : 280;
      const isMobile = window.innerWidth <= 648;
      const gap = isMobile ? 16 : 24;
      return w + gap;
    };

    const getGroupWidth = () => {
      if (firstGroup && firstGroup.offsetWidth > 0) {
        return firstGroup.offsetWidth;
      }
      return (carouselProducts.length || 10) * getCardStep();
    };

    // Center Card 0 of Group 1
    const initPosition = () => {
      if (!viewport) return;
      const W = getGroupWidth();
      const card = viewport.querySelector('.best-sellers-card');
      const w = card ? card.offsetWidth : 280;
      const target = W - (viewport.clientWidth - w) / 2;
      if (target > 0) {
        viewport.scrollLeft = target;
      }
    };

    initPosition();
    const t1 = setTimeout(initPosition, 80);
    const t2 = setTimeout(initPosition, 250);

    // Auto-scroll every 2 seconds
    const intervalId = setInterval(() => {
      if (!viewport) return;
      if (document.hidden) return;
      if (Date.now() < carouselPauseUntilRef.current) return;
      if (carouselHoveringRef.current || carouselTouchingRef.current) return;

      const step = getCardStep();
      const W = getGroupWidth();

      // If scrolled near the end of Group 2, wrap seamlessly back into Group 1
      if (viewport.scrollLeft >= 2 * W - viewport.clientWidth) {
        viewport.scrollLeft -= W;
      }

      viewport.scrollBy({ left: step, behavior: 'smooth' });
    }, 2000);

    const onPointerDown = () => {
      carouselTouchingRef.current = true;
      carouselPauseUntilRef.current = Date.now() + 3500;
    };
    const onPointerUp = () => {
      carouselTouchingRef.current = false;
      carouselPauseUntilRef.current = Date.now() + 3500;
    };
    const onMouseEnter = () => {
      carouselHoveringRef.current = true;
    };
    const onMouseLeave = () => {
      carouselHoveringRef.current = false;
    };

    viewport.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    viewport.addEventListener('mouseenter', onMouseEnter);
    viewport.addEventListener('mouseleave', onMouseLeave);

    return () => {
      clearInterval(intervalId);
      clearTimeout(t1);
      clearTimeout(t2);
      viewport.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('mouseenter', onMouseEnter);
      viewport.removeEventListener('mouseleave', onMouseLeave);
      carouselTouchingRef.current = false;
      carouselHoveringRef.current = false;
    };
  }, [loadingBestsellers, bestsellers.length, carouselProducts.length]);

  const navigateBestsellers = (direction) => {
    const viewport = bestsellersViewportRef.current;
    const firstGroup = bestsellersGroupRef.current;
    if (!viewport) return;
    carouselPauseUntilRef.current = Date.now() + 3500;

    const card = viewport.querySelector('.best-sellers-card');
    const w = card ? card.offsetWidth : 280;
    const isMobile = window.innerWidth <= 648;
    const gap = isMobile ? 16 : 24;
    const step = w + gap;
    const W = firstGroup && firstGroup.offsetWidth > 0 ? firstGroup.offsetWidth : (carouselProducts.length || 10) * step;

    if (direction > 0) {
      if (viewport.scrollLeft >= 2 * W - viewport.clientWidth) {
        viewport.scrollLeft -= W;
      }
      viewport.scrollBy({ left: step, behavior: 'smooth' });
    } else {
      if (viewport.scrollLeft <= W / 2) {
        viewport.scrollLeft += W;
      }
      viewport.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const activeBanner = banners.length > 0 ? banners[0] : null;
  const bannerImg = activeBanner
    ? breakpoint === 'mobile'
      ? activeBanner.mobileImage
      : breakpoint === 'tablet'
        ? activeBanner.tabletImage || activeBanner.desktopImage
        : activeBanner.desktopImage
    : null;
  const showBanner = bannerImg?.url;

  return (
    <div className="home-page" style={{ background: 'transparent' }}>
      {/* Hero */}
      {showBanner ? (
        <section className="home-hero-banner" style={{ width: '100%', position: 'relative', overflow: 'hidden', paddingTop: 100 }}>
          <img
            src={bannerImg.url}
            alt="PrettyGlitz Banner"
            style={{ width: '100%', display: 'block', maxHeight: '90vh', objectFit: 'cover' }}
          />
        </section>
      ) : (
        <section
          className="section-py"
          style={{
            minHeight: 'min(85vh, 700px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: 110,
          }}
        >
          <div className="section-padding" style={{ textAlign: 'center', maxWidth: 900, zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
            >
              <p
                style={{
                  fontSize: '0.8rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  marginBottom: 24,
                }}
              >
                Premium Accessories
              </p>
              <h1
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 600,
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  lineHeight: 1.1,
                  margin: '0 0 24px',
                  color: 'var(--text)',
                }}
              >
                Beauty in{' '}
                <span
                  style={{
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Every Detail
                </span>
              </h1>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: 'var(--text-secondary)',
                  maxWidth: 560,
                  margin: '0 auto 40px',
                  lineHeight: 1.7,
                }}
              >
                Discover exquisite bangles, everlasting artificial flowers, and premium jewels crafted for your most precious moments.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
            >
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => collectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    padding: '14px 36px',
                    borderRadius: 999,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    letterSpacing: '0.04em',
                    boxShadow: '0 8px 24px rgba(196,56,108,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px)';
                    event.currentTarget.style.boxShadow = '0 12px 32px rgba(196,56,108,0.4)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'none';
                    event.currentTarget.style.boxShadow = '0 8px 24px rgba(196,56,108,0.3)';
                  }}
                >
                  Explore Collection <ChevronDown size={16} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  marginTop: 12,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="var(--accent-gold)" /> Premium Quality
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--accent-gold)' }}>🚚</span> All-India Delivery
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#25D366' }}>💬</span> Order via WhatsApp
                </span>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Collections Grid — restored to the earlier collection-grid/theme-card design */}
      <section
        ref={collectionsRef}
        className="section-padding section-py"
        style={{ maxWidth: 1280, margin: '0 auto', scrollMarginTop: 80 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <p
            style={{
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Our Collections
          </p>
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 600,
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Explore Our Collections
          </h2>
        </motion.div>

        <div className="collection-grid">
          {loadingCollections ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div className="collection-card-skeleton" key={index}>
                <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                </div>
                <div
                  style={{
                    padding: 16,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div className="skeleton" style={{ height: 20, width: '65%', marginBottom: 10, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 4 }} />
                </div>
              </div>
            ))
          ) : (
            collections.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <Link
                  to={`/category/${encodeURIComponent(category.name)}`}
                  style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                >
                  <div
                    className="theme-card"
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '4/3',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={
                          category.bannerImage
                            ? optimizeImageUrl(category.bannerImage, {
                                width: 600,
                                height: 450,
                                crop: 'fill',
                                gravity: 'auto',
                              })
                            : logoImg
                        }
                        alt={category.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = logoImg;
                          event.currentTarget.style.objectFit = 'contain';
                          event.currentTarget.style.padding = '24px';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: category.bannerImage ? 'cover' : 'contain',
                          padding: category.bannerImage ? 0 : '24px',
                          transition: 'transform 0.5s ease',
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: 16,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background: 'var(--bg-card)',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          color: 'var(--text)',
                          margin: '0 0 8px',
                        }}
                      >
                        {category.name}
                      </h3>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          color: 'var(--accent)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        Explore <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Offers */}
      {(loadingOffers || offers.length > 0) && (
        <section className="section-padding section-py" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, gap: 20 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p
                style={{
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Special Deals
              </p>
              <h2
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 600,
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Exclusive Offers
              </h2>
            </motion.div>
            <Link
              to="/offers"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                borderBottom: '2px solid var(--text)',
                paddingBottom: 2,
                whiteSpace: 'nowrap',
              }}
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="product-grid-4">
            {loadingOffers
              ? Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
              : offers.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {(loadingBestsellers || bestsellers.length > 0) && (
        <section
          className="section-py"
          style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-padding"
              style={{ textAlign: 'center', marginBottom: 32 }}
            >
              <p
                style={{
                  color: 'var(--accent)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Customer Favourites
              </p>
              <h2
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 600,
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Best Sellers
              </h2>
            </motion.div>

            <div className="best-sellers-carousel-layout">
              <div
                className="best-sellers-viewport"
                ref={bestsellersViewportRef}
                aria-label="Best-selling products"
                tabIndex={0}
              >
                {loadingBestsellers ? (
                  <div className="best-sellers-track">
                    <div className="best-sellers-group">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div className="best-sellers-card" key={`bestseller-skel-${index}`}>
                          <ProductCardSkeleton />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="best-sellers-track">
                    {[0, 1, 2].map((groupIndex) => (
                      <div
                        className="best-sellers-group"
                        key={`best-sellers-group-${groupIndex}`}
                        ref={groupIndex === 0 ? bestsellersGroupRef : null}
                        aria-hidden={groupIndex !== 1}
                      >
                        {carouselProducts.map((product, productIndex) => (
                          <div
                            className="best-sellers-card"
                            key={`${groupIndex}-${product._id || productIndex}-${productIndex}`}
                          >
                            <ProductCard product={product} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!loadingBestsellers && (
                <div className="best-sellers-controls" aria-label="Best Sellers carousel navigation">
                  <button
                    type="button"
                    className="best-sellers-nav-button"
                    aria-label="Scroll to previous best sellers"
                    onClick={() => navigateBestsellers(-1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="best-sellers-nav-button"
                    aria-label="Scroll to next best sellers"
                    onClick={() => navigateBestsellers(1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section-padding section-py" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <p
              style={{
                color: 'var(--accent)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              What They Say
            </p>
            <h2
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontWeight: 600,
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                color: 'var(--text)',
                margin: 0,
              }}
            >
              Customer Love
            </h2>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial._id || `${testimonial.customerName}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  position: 'relative',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <Quote size={24} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                  {Array.from({ length: testimonial.rating || 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    margin: '0 0 20px',
                    fontStyle: 'italic',
                  }}
                >
                  “{testimonial.review}”
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {testimonial.avatar?.url ? (
                    <img
                      src={testimonial.avatar.url}
                      alt={testimonial.customerName || 'Customer'}
                      loading="lazy"
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1rem',
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {(testimonial.customerName || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>
                      {testimonial.customerName}
                    </p>
                    {testimonial.location && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        {testimonial.location}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Values */}
      <section className="section-padding section-py" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 40,
          }}
        >
          {[
            {
              icon: <Crown size={32} color="var(--accent-gold)" strokeWidth={1.5} />,
              title: 'Premium Quality',
              desc: 'Every piece is curated with care for exceptional craftsmanship.',
            },
            {
              icon: <Sparkles size={32} color="var(--accent)" strokeWidth={1.5} />,
              title: 'Unique Designs',
              desc: "Exclusive collections you won't find anywhere else.",
            },
            {
              icon: <MessageCircle size={32} color="#10B981" strokeWidth={1.5} />,
              title: 'Easy Ordering',
              desc: 'Simple WhatsApp-based ordering with instant confirmation.',
            },
            {
              icon: <Heart size={32} color="#EF4444" strokeWidth={1.5} />,
              title: 'Made with Love',
              desc: 'Passion-driven accessories that celebrate your beauty.',
            },
          ].map(({ icon, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'var(--bg-secondary)',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  alignItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {icon}
              </div>
              <h4
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--text)',
                  margin: '0 0 10px',
                }}
              >
                {title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;