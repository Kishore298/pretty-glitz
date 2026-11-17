import api from './api';

const SESSION_KEY = 'pg_analytics_session_id';

/**
 * Returns or initializes a persistent anonymous session ID for guest analytics tracking.
 */
export const getAnalyticsSessionId = () => {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'fallback_sid_' + Date.now();
  }
};

/**
 * Dispatches an analytics event to the backend in a non-blocking fire-and-forget fashion.
 * Does not block client UI or throw errors if network is offline.
 */
export const trackProductEvent = async (productId, eventType, quantity = 1, metadata = {}) => {
  if (!productId || !eventType) return;

  try {
    const pId = typeof productId === 'object' ? productId._id : productId;
    const sessionId = getAnalyticsSessionId();

    api.post('/analytics/event', {
      productId: pId,
      eventType,
      sessionId,
      quantity,
      metadata,
    }).catch(() => {
      // Fire-and-forget; silently ignore non-critical network errors
    });
  } catch {
    // Graceful swallow
  }
};

let syncTimer = null;

/**
 * Synchronizes live unauthenticated guest cart & wishlist arrays with the backend
 * so that Admin Product Demand Analytics reflects real-time customer intent accurately.
 */
export const syncGuestState = (cartItems = null, wishlistItems = null) => {
  const token = localStorage.getItem('customerToken');
  if (token) return; // Authenticated users are already persisted to server models

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    try {
      const sessionId = getAnalyticsSessionId();

      let currentCart = cartItems;
      if (!currentCart) {
        const saved = localStorage.getItem('prettyglitz_cart');
        currentCart = saved ? JSON.parse(saved) : [];
      }

      let currentWishlist = wishlistItems;
      if (!currentWishlist) {
        const saved = localStorage.getItem('prettyglitz_wishlist');
        currentWishlist = saved ? JSON.parse(saved) : [];
      }

      const cartPayload = (Array.isArray(currentCart) ? currentCart : [])
        .map(i => ({
          productId: typeof i.product === 'object' ? i.product?._id : (i.productId || i.product),
          quantity: i.quantity || 1,
        }))
        .filter(i => !!i.productId);

      const wishlistPayload = (Array.isArray(currentWishlist) ? currentWishlist : [])
        .map(item => typeof item === 'object' ? item?._id : item)
        .filter(Boolean);

      api.post('/analytics/sync-guest', {
        sessionId,
        cart: cartPayload,
        wishlist: wishlistPayload,
      }).catch(() => {});
    } catch {
      // Non-blocking swallow
    }
  }, 350);
};

