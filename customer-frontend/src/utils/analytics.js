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

