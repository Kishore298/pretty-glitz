import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Universal Scroll Restoration & Management
 *
 * 1. Sets manual browser scroll restoration to prevent flickering / jarring animations.
 * 2. Continuously records scroll position keyed by path+search in sessionStorage.
 * 3. Restores exact previous scroll position instantly when:
 *    - Returning from Cart via "Continue Shopping" or link navigation (`restoreScrollY` in state).
 *    - Navigating back/forward via browser history (`POP` navigation).
 * 4. Micro-retries ensure positions lock in accurately even as async images or components mount.
 * 5. Resets to top (0, 0) on new forward (`PUSH`) navigations.
 */
const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  // Ensure manual scroll restoration globally
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Continuously record scroll position per route
  useEffect(() => {
    const currentKey = location.pathname + location.search;

    // Also track last non-cart page for Cart -> Continue Shopping
    if (location.pathname !== '/cart') {
      try {
        sessionStorage.setItem('pg_prev_page', currentKey + location.hash);
      } catch {}
    }

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      try {
        sessionStorage.setItem(`pg_pos_${currentKey}`, String(Math.round(scrollY)));
        if (location.pathname !== '/cart') {
          sessionStorage.setItem('pg_prev_scroll', String(Math.round(scrollY)));
        }
      } catch {}
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Record initial on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, location.search, location.hash]);

  // Handle instant scroll restoration on route transition
  useEffect(() => {
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const currentKey = location.pathname + location.search;
    let targetY = null;

    // Explicit state restore request (e.g. from Cart Continue Shopping)
    if (typeof location.state?.restoreScrollY === 'number' && !isNaN(location.state.restoreScrollY) && location.state.restoreScrollY >= 0) {
      targetY = location.state.restoreScrollY;
    } else if (navType === 'POP') {
      // Browser back/forward navigation: check saved route position
      try {
        const saved = sessionStorage.getItem(`pg_pos_${currentKey}`);
        if (saved !== null) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            targetY = parsed;
          }
        }
      } catch {}
    }

    if (targetY !== null) {
      const instantRestore = () => {
        try {
          window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
        } catch {
          window.scrollTo(0, targetY);
        }
      };

      instantRestore();
      // Micro-retries to ensure lock-in as async product images/sections hydrate
      const t1 = setTimeout(instantRestore, 30);
      const t2 = setTimeout(instantRestore, 90);
      const t3 = setTimeout(instantRestore, 180);

      const raf = requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior;
      });

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        cancelAnimationFrame(raf);
      };
    }

    // Default forward navigation: instant reset to top
    if (navType !== 'POP') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }

      const raf = requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior;
      });

      return () => cancelAnimationFrame(raf);
    }
  }, [location, navType]);

  return null;
};

export default ScrollToTop;
