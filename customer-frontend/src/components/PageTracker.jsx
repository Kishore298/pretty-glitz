import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';

/**
 * Get or initialize persistent unique device ID (stored in localStorage)
 */
export const getDeviceId = () => {
  try {
    let id = localStorage.getItem('pg_device_id');
    if (!id) {
      id = 'pg_dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('pg_device_id', id);
    }
    return id;
  } catch {
    return 'pg_dev_fallback_' + Date.now();
  }
};

/**
 * Accurately detects current platform mode.
 * Responsive testing in Chrome DevTools (<768px) correctly reports 'mobile'.
 * Fullscreen / regular desktop (>=1024px) reports 'desktop'.
 */
export const getPlatform = () => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

/**
 * Sends page visit via Axios (for smooth, reliable in-app navigation)
 */
const sendVisitApi = (payload) => {
  api.post('/analytics/page-visit', payload).catch(() => {});
};

/**
 * Sends page visit via fetch keepalive (for beforeunload or tab close)
 */
const sendUnloadBeacon = (payload) => {
  try {
    const jsonStr = JSON.stringify(payload);
    const backendBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const endpoint = `${backendBase}/analytics/page-visit`;

    if (typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, jsonStr);
    }
  } catch {
    // silent fallback
  }
};

/**
 * PageTracker
 *
 * Automatically records page views and measures user engagement duration per page.
 * Strictly deduplicated by physical deviceId.
 */
const PageTracker = () => {
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  const currentTitleRef = useRef(document.title);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const deviceId = getDeviceId();
    const platform = getPlatform();
    const currentPath = location.pathname;
    const currentTitle = document.title || currentPath;

    // 1. Flush time spent on previous page
    if (currentPathRef.current && currentPathRef.current !== currentPath) {
      const durationSeconds = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
      if (durationSeconds > 0) {
        sendVisitApi({
          deviceId,
          path: currentPathRef.current,
          pageTitle: currentTitleRef.current,
          durationSeconds: Math.min(durationSeconds, 1800),
          platform,
        });
      }
    }

    // 2. Set new page context
    currentPathRef.current = currentPath;
    currentTitleRef.current = currentTitle;
    startTimeRef.current = Date.now();

    // 3. Immediately register new page hit with 0 initial duration
    sendVisitApi({
      deviceId,
      path: currentPath,
      pageTitle: currentTitle,
      durationSeconds: 0,
      platform,
    });
  }, [location.pathname]);

  // 4. Flush remaining time on window unload or visibility change
  useEffect(() => {
    const handleFlush = () => {
      const durationSeconds = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
      if (durationSeconds >= 1 && currentPathRef.current) {
        sendUnloadBeacon({
          deviceId: getDeviceId(),
          path: currentPathRef.current,
          pageTitle: currentTitleRef.current,
          durationSeconds: Math.min(durationSeconds, 1800),
          platform: getPlatform(),
        });
        startTimeRef.current = Date.now();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      } else {
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleFlush();
    };
  }, []);

  return null;
};

export default PageTracker;
