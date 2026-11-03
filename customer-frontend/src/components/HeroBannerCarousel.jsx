import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

const HeroBannerCarousel = ({ banners = [], loading = false }) => {
  // Only display real, active banners from the database that have a valid image URL
  const activeSlides = Array.isArray(banners)
    ? banners.filter(
        (b) => b && b.isActive !== false && (b.desktopImage?.url || b.mobileImage?.url)
      )
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-clamp / reset currentIndex when activeSlides changes
  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  // Touch tracking for finger swipe on mobile
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  // Advance to next slide
  const handleNext = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  // Go to previous slide
  const handlePrev = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Auto-scroll every 2.5 seconds (2500ms) only when multiple slides exist
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 2500);

    return () => clearInterval(timer);
  }, [activeSlides.length, isPaused, handleNext]);

  // If loading and awaiting dynamic banners, render a smooth placeholder instead of flashing static images
  if (loading && activeSlides.length === 0) {
    return (
      <section
        className="hero-banner-section"
        aria-label="Loading Hero Banners"
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 7',
            minHeight: 240,
            background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.04) 0%, rgba(201, 168, 76, 0.07) 50%, rgba(196, 56, 108, 0.04) 100%)',
          }}
        />
      </section>
    );
  }

  // If no slides available at all, return null
  if (activeSlides.length === 0) {
    return null;
  }

  // Touch event handlers for mobile finger swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    // Require minimum 40px swipe distance
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNext(); // swipe left -> next
      } else {
        handlePrev(); // swipe right -> prev
      }
    }
    // Resume auto-scroll after a short delay
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <section
      className="hero-banner-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Storefront Hero Banners"
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
      }}
    >
      {/* Banner Viewport (Image Carousel + Navigation Arrows) */}
      <div
        className="hero-banner-viewport"
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Banner Slides Container */}
        <div
          className="hero-banner-track"
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {activeSlides.map((slide, idx) => {
            const desktopUrl = slide.desktopImage?.url || slide.mobileImage?.url;
            const mobileUrl = slide.mobileImage?.url || slide.desktopImage?.url;

            return (
              <div
                key={slide._id || idx}
                className="hero-banner-slide"
                style={{
                  minWidth: '100%',
                  width: '100%',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {/* Banner image wrapped in Link when linkTo is set */}
                {slide.linkTo ? (
                  <Link
                    to={slide.linkTo}
                    style={{ display: 'block', width: '100%', textDecoration: 'none' }}
                  >
                    <picture style={{ display: 'block', width: '100%' }}>
                      <source
                        media="(max-width: 767px)"
                        srcSet={mobileUrl ? optimizeImageUrl(mobileUrl, 1080) : ''}
                      />
                      <source
                        media="(min-width: 768px)"
                        srcSet={desktopUrl ? optimizeImageUrl(desktopUrl, 2560) : ''}
                      />
                      <img
                        src={desktopUrl || mobileUrl || logoImg}
                        alt={slide.title || 'PrettyGlitz Banner'}
                        className="hero-banner-img"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = logoImg;
                          e.currentTarget.style.objectFit = 'contain';
                          e.currentTarget.style.padding = '40px';
                        }}
                      />
                    </picture>
                  </Link>
                ) : (
                  <picture style={{ display: 'block', width: '100%' }}>
                    <source
                      media="(max-width: 767px)"
                      srcSet={mobileUrl ? optimizeImageUrl(mobileUrl, 1080) : ''}
                    />
                    <source
                      media="(min-width: 768px)"
                      srcSet={desktopUrl ? optimizeImageUrl(desktopUrl, 2560) : ''}
                    />
                    <img
                      src={desktopUrl || mobileUrl || logoImg}
                      alt={slide.title || 'PrettyGlitz Banner'}
                      className="hero-banner-img"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = logoImg;
                        e.currentTarget.style.objectFit = 'contain';
                        e.currentTarget.style.padding = '40px';
                      }}
                    />
                  </picture>
                )}

                {/* Dynamic "Explore Collection" CTA Button at Bottom Center (where dots used to be) */}
                {slide.linkTo && (
                  <div className="hero-banner-cta-container">
                    <Link
                      to={slide.linkTo}
                      className="hero-banner-cta-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Explore Collection</span>
                      <span className="hero-banner-cta-arrow" aria-hidden="true">→</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Manual Scroll Buttons (Bigger Devices Only — Hidden on mobile via CSS) */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePrev();
              }}
              className="hero-carousel-nav-btn hero-carousel-btn-prev"
              aria-label="Previous Banner"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="hero-carousel-nav-btn hero-carousel-btn-next"
              aria-label="Next Banner"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators (Pills / Dots) — Placed right below the banner! */}
      {activeSlides.length > 1 && (
        <div className="hero-carousel-dots">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`hero-carousel-dot ${idx === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBannerCarousel;
