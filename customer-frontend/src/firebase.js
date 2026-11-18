import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import api from './utils/api';

let messagingInstance = null;
let firebaseAppInstance = null;
let cachedConfig = null;

/**
 * Initializes Firebase App using config fetched dynamically from backend
 */
export const initCustomerFirebase = async () => {
  if (firebaseAppInstance && messagingInstance) {
    return { app: firebaseAppInstance, messaging: messagingInstance, vapidKey: cachedConfig?.vapidKey };
  }

  try {
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.info('[Firebase] Push notifications are not supported on this browser or platform.');
      return { app: null, messaging: null, supported: false };
    }

    let config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    };

    try {
      const res = await api.get('/notifications/firebase-config');
      if (res.data) {
        config = { ...config, ...res.data };
      }
    } catch {
      // Use fallback env vars
    }

    if (!config.apiKey || !config.projectId) {
      return { app: null, messaging: null, configNeeded: true, vapidKey: config.vapidKey };
    }

    cachedConfig = config;
    firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    messagingInstance = getMessaging(firebaseAppInstance);

    return { app: firebaseAppInstance, messaging: messagingInstance, vapidKey: config.vapidKey, supported: true };
  } catch (err) {
    console.error('[Firebase] Customer client initialization error:', err);
    return { app: null, messaging: null, error: err.message };
  }
};

/**
 * Prompt customer for push notification permission and register FCM token.
 * Optionally associates mobile or orderId for live shipment updates.
 */
export const requestCustomerNotificationPermission = async ({ mobile, orderId } = {}) => {
  try {
    if (!('Notification' in window)) {
      return { success: false, status: 'unsupported', message: 'Notifications not supported in this browser.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, status: permission, message: 'Notification permission was not granted.' };
    }

    const { messaging, vapidKey } = await initCustomerFirebase();
    if (!messaging) {
      return { success: false, status: 'unavailable', message: 'Push messaging service unavailable.' };
    }

    // Ensure service worker is registered
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    if (!token) {
      throw new Error('Unable to generate FCM device token.');
    }

    // Persist locally
    localStorage.setItem('pg_customer_fcm_token', token);

    // Register token with backend
    await api.post('/notifications/customer-fcm-token', {
      token,
      mobile: mobile || localStorage.getItem('pg_customer_mobile') || '',
      orderId: orderId || '',
      deviceInfo: navigator.userAgent,
    });

    return { success: true, token, status: 'granted' };
  } catch (err) {
    console.error('[Firebase] requestCustomerNotificationPermission error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Link an orderId or customer mobile to the already registered customer FCM token
 */
export const linkOrderToCustomerFcm = async (orderId, mobile) => {
  try {
    const existingToken = localStorage.getItem('pg_customer_fcm_token');
    if (!existingToken) {
      // If permission is already granted, attempt registration
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        return await requestCustomerNotificationPermission({ orderId, mobile });
      }
      return { success: false, status: 'no_token' };
    }

    await api.post('/notifications/customer-fcm-token', {
      token: existingToken,
      mobile: mobile || '',
      orderId: orderId || '',
      deviceInfo: navigator.userAgent,
    });

    return { success: true };
  } catch (err) {
    console.warn('[Firebase] linkOrderToCustomerFcm warning:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Set up a listener for foreground messages while the customer is on the website
 */
export const subscribeForegroundMessages = async (callback) => {
  const { messaging } = await initCustomerFirebase();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    if (callback) {
      callback(payload);
    }
  });
};
