import React, { useRef, useEffect, useCallback } from 'react';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

/**
 * SwipeGalleryStage
 *
 * GPU-accelerated horizontal swipe image gallery with:
 * - Zero React re-renders during finger drag (uses refs + direct translate3d transform)
 * - Automatic vertical vs horizontal scroll intent detection
 * - Fast-flick velocity threshold + smooth wrap-around transitions
 * - Preloading of adjacent images for instant zero-flicker swipes
 * - Clickable dot indicators visible on ALL device widths
 */
const SwipeGalleryStage = ({
  images = [],
  activeIndex = 0,
  onIndexChange,
  onStageClick,
  alt = 'Product image',
  imageWidth = 1200,
  priority = false,
  borderRadius = 0,
  hasCornerButton = false,
  className = '',
  style = {},
  children,
}) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const dotsRowRef = useRef(null);
  const activeDotRef = useRef(null);

  // Gesture state kept entirely in refs so touchmove runs at 60/120fps with zero React re-renders
  const gestureRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    lock: null, // 'horizontal' | 'vertical' | null
    moved: false,
    rafId: null,
    currentOffset: 0,
  });

  const safeCount = images.length;
  const clampedIndex = safeCount > 0 ? Math.max(0, Math.min(activeIndex, safeCount - 1)) : 0;

  // Keep track synced to clampedIndex whenever index changes externally
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    track.style.transform = `translate3d(-${clampedIndex * 100}%, 0, 0)`;
  }, [clampedIndex]);

  // Auto-center active dot when many images overflow compact pill
  useEffect(() => {
    if (activeDotRef.current && dotsRowRef.current) {
      const container = dotsRowRef.current;
      const dot = activeDotRef.current;
      const targetLeft = dot.offsetLeft - container.clientWidth / 2 + dot.clientWidth / 2;
      if (Math.abs(container.scrollLeft - targetLeft) > 4) {
        container.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    }
  }, [clampedIndex]);

  // Preload previous and next images so swiping never flashes blank
  useEffect(() => {
    if (safeCount <= 1 || typeof Image === 'undefined') return;
    const prevIdx = (clampedIndex - 1 + safeCount) % safeCount;
    const nextIdx = (clampedIndex + 1) % safeCount;
    [prevIdx, nextIdx].forEach((idx) => {
      const item = images[idx];
      const rawUrl = typeof item === 'string' ? item : item?.url;
      if (rawUrl) {
        const img = new Image();
        img.src = optimizeImageUrl(rawUrl, imageWidth);
      }
    });
  }, [clampedIndex, safeCount, images, imageWidth]);

  // Clean up any pending rAF on unmount
  useEffect(() => {
    const g = gestureRef.current;
    return () => {
      if (g.rafId) cancelAnimationFrame(g.rafId);
    };
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      if (safeCount <= 1 || !e.targetTouches || e.targetTouches.length === 0) {
        gestureRef.current.moved = false;
        return;
      }
      const touch = e.targetTouches[0];
      const g = gestureRef.current;
      if (g.rafId) cancelAnimationFrame(g.rafId);
      g.active = true;
      g.startX = touch.clientX;
      g.startY = touch.clientY;
      g.lastX = touch.clientX;
      g.startTime = performance.now();
      g.lock = null;
      g.moved = false;
      g.currentOffset = 0;

      if (trackRef.current) {
        trackRef.current.style.transition = 'none';
      }
    },
    [safeCount]
  );

  const handleTouchMove = useCallback(
    (e) => {
      const g = gestureRef.current;
      if (!g.active || safeCount <= 1 || !e.targetTouches || e.targetTouches.length === 0) return;

      const touch = e.targetTouches[0];
      const dx = touch.clientX - g.startX;
      const dy = touch.clientY - g.startY;
      g.lastX = touch.clientX;

      if (g.lock === null) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          g.lock = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
          if (g.lock === 'horizontal') {
            g.moved = true;
          }
        }
      }

      if (g.lock !== 'horizontal') return;

      // Apply slight elastic resistance only when pulling past edge boundaries
      let adjustedDx = dx;
      if ((clampedIndex === 0 && dx > 0) || (clampedIndex === safeCount - 1 && dx < 0)) {
        adjustedDx = dx * 0.42;
      }
      g.currentOffset = adjustedDx;

      if (!g.rafId) {
        g.rafId = requestAnimationFrame(() => {
          g.rafId = null;
          if (trackRef.current && g.active && g.lock === 'horizontal') {
            trackRef.current.style.transform = `translate3d(calc(-${clampedIndex * 100}% + ${g.currentOffset}px), 0, 0)`;
          }
        });
      }
    },
    [clampedIndex, safeCount]
  );

  const handleTouchEnd = useCallback(() => {
    const g = gestureRef.current;
    if (!g.active) return;
    g.active = false;
    if (g.rafId) {
      cancelAnimationFrame(g.rafId);
      g.rafId = null;
    }

    const track = trackRef.current;
    const containerWidth = containerRef.current?.clientWidth || 320;
    const dx = g.lastX - g.startX;
    const dt = performance.now() - g.startTime;

    const threshold = Math.min(48, containerWidth * 0.14);
    const isFastFlick = Math.abs(dx) > 18 && dt < 240;

    let targetIndex = clampedIndex;
    if (g.lock === 'horizontal' && safeCount > 1 && (Math.abs(dx) > threshold || isFastFlick)) {
      if (dx < 0) {
        targetIndex = (clampedIndex + 1) % safeCount;
      } else {
        targetIndex = (clampedIndex - 1 + safeCount) % safeCount;
      }
    }

    if (track) {
      track.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
      track.style.transform = `translate3d(-${targetIndex * 100}%, 0, 0)`;
    }

    if (targetIndex !== clampedIndex && typeof onIndexChange === 'function') {
      onIndexChange(targetIndex);
    }

    // Clear moved flag on next tick so synthetic onClick knows whether a swipe just happened
    setTimeout(() => {
      gestureRef.current.moved = false;
      gestureRef.current.lock = null;
    }, 50);
  }, [clampedIndex, safeCount, onIndexChange]);

  const handleContainerClick = useCallback(
    (e) => {
      if (gestureRef.current.moved) return;
      if (typeof onStageClick === 'function') {
        onStageClick(e);
      }
    },
    [onStageClick]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: safeCount > 1 ? 'pan-y' : 'auto',
        ...style,
      }}
    >
      {/* Horizontal GPU Slide Track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          transform: `translate3d(-${clampedIndex * 100}%, 0, 0)`,
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: safeCount > 1 ? 'transform' : 'auto',
        }}
      >
        {safeCount > 0 ? (
          images.map((item, idx) => {
            const rawUrl = typeof item === 'string' ? item : item?.url;
            const isNear = Math.abs(idx - clampedIndex) <= 1 || idx === 0;
            return (
              <div
                key={item?.id || rawUrl || idx}
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  userSelect: 'none',
                }}
              >
                <img
                  src={rawUrl ? optimizeImageUrl(rawUrl, imageWidth) : logoImg}
                  alt={`${alt} ${safeCount > 1 ? `(${idx + 1})` : ''}`.trim()}
                  loading={priority && idx === clampedIndex ? 'eager' : isNear ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = logoImg;
                    e.currentTarget.style.objectFit = 'contain';
                    e.currentTarget.style.padding = '40px';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            );
          })
        ) : (
          <div style={{ flex: '0 0 100%', width: '100%', height: '100%' }}>
            <img
              src={logoImg}
              alt={alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '40px',
                display: 'block',
              }}
            />
          </div>
        )}
      </div>

      {/* Dot Indicators — always displayed across ALL screen widths when multiple images exist */}
      {safeCount > 1 && (
        <div
          ref={dotsRowRef}
          className="pg-gallery-dots-pill"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 5,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(15, 12, 18, 0.52)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: hasCornerButton ? 'calc(100% - 108px)' : 'calc(100% - 32px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            pointerEvents: 'auto',
          }}
        >
          {images.map((_, dotIdx) => {
            const isCurrent = dotIdx === clampedIndex;
            return (
              <button
                key={dotIdx}
                ref={isCurrent ? activeDotRef : null}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof onIndexChange === 'function') {
                    onIndexChange(dotIdx);
                  }
                }}
                aria-label={`Go to image ${dotIdx + 1} of ${safeCount}`}
                title={`Photo ${dotIdx + 1} of ${safeCount}`}
                style={{
                  flexShrink: 0,
                  width: isCurrent ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: isCurrent ? 'var(--accent, #C4386C)' : 'rgba(255, 255, 255, 0.65)',
                  boxShadow: isCurrent ? '0 0 6px rgba(196, 56, 108, 0.7)' : 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.22s ease, background-color 0.22s ease',
                }}
              />
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
};

export default React.memo(SwipeGalleryStage);
