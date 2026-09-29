import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Automatically scroll to the top on navigation,
    // except for the Subcategories/Product Listing (category) page.
    if (!pathname.startsWith('/category/')) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
