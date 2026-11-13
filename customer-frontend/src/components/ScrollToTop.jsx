import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop
 *
 * Instantly resets scroll position to the top on forward route navigation,
 * suppressing any unwanted smooth-scrolling animations between pages or products.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // 'POP' means the user navigated back/forward in the browser history.
    // On 'PUSH' or 'REPLACE' (normal navigation), jump to top instantly.
    if (navType !== 'POP') {
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
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
