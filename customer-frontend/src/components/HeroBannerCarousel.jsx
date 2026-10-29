import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

// Fallback high-fashion atelier banners when no banners are uploaded in DB yet
const DEFAULT_FALLBACK_BANNERS = [
  {
    _id: 'default-1',
    title: 'Exquisite Handcrafted Bangles Atelier',
    desktopImage: {
      url: 'https://images.unsplash.com/photo-1611591475870-74f4b2323a7d?q=80&w=2000&auto=format&fit=crop',
    },
    mobileImage: {
      url: 'https://images.unsplash.com/photo-1611591475870-74f4b2323a7d?q=80&w=1000&auto=format&fit=crop',
    },
  },
  {
    _id: 'default-2',
    title: 'Royal Bridal Jewels & Accessories',
    desktopImage: {
      url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000&auto=format&fit=crop',
    },
    mobileImage: {
      url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop',
    },
  },
  {
    _id: 'default-3',
    title: 'Everlasting Artificial Floral Accessories',
    desktopImage: {
      url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=2000&auto=format&fit=crop',
    },
    mobileImage: {
      url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop',
    },
  },
];

const HeroBannerCarousel = ({ banners = [] }) => {
  // Use DB banners if available, otherwise fallback to curated luxury banner slides
  const activeSlides = banners.length > 0 ? banners : DEFAULT_FALLBACK_BANNERS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch tracking for finger swipe on mobile
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  // Advance to next slide
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  // Go to previous slide
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Auto-scroll every 2.5 seconds (2500ms)
  useEffect(() => {
    if (activeSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 2500);

    return () => clearInterval(timer);
  }, [activeSlides.length, isPaused, handleNext]);

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
        overflow: 'hidden',
        userSelect: 'none',
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
              {/* Responsive <picture> tag: automatically renders mobile image on smaller devices and desktop image on bigger devices */}
              <picture style={{ display: 'block', width: '100%', height: '100%' }}>
                {/* Smaller devices breakpoint: < 768px */}
                <source
                  media="(max-width: 767px)"
                  srcSet={mobileUrl ? optimizeImageUrl(mobileUrl, 800) : ''}
                />
                {/* Desktop and larger devices: >= 768px */}
                <source
                  media="(min-width: 768px)"
                  srcSet={desktopUrl ? optimizeImageUrl(desktopUrl, 1920) : ''}
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

      {/* Slide Indicators (Pills / Dots) */}
      {activeSlides.length > 1 && (
        <div
          className="hero-carousel-dots"
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
          }}
        >
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
