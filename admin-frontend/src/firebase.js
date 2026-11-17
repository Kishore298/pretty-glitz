import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import api from './utils/api';

let messagingInstance = null;
let firebaseAppInstance = null;

/**
 * Initializes Firebase App using config fetched from backend or local env vars
 */
export const initFirebaseClient = async () => {
  if (firebaseAppInstance) return { app: firebaseAppInstance, messaging: messagingInstance };

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[Firebase] Firebase Messaging is not supported in this browser.');
      return { app: null, messaging: null };
    }

    // 1. Fetch config from server
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
    } catch (apiErr) {
      console.warn('[Firebase] Could not fetch server Firebase config, using local fallbacks.');
    }

    if (!config.apiKey || !config.projectId) {
      console.info('[Firebase] Firebase keys not yet filled in. Ready to connect once added.');
      return { app: null, messaging: null, configNeeded: true, vapidKey: config.vapidKey };
    }

    firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    messagingInstance = getMessaging(firebaseAppInstance);

    return { app: firebaseAppInstance, messaging: messagingInstance, vapidKey: config.vapidKey };
  } catch (err) {
    console.error('[Firebase] Client initialization error:', err);
    return { app: null, messaging: null, error: err.message };
  }
};

/**
 * Requests notification permission, retrieves FCM token, and registers it with the backend.
 */
export const requestFcmRegistration = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, status: permission, message: 'Notification permission denied.' };
    }

    const { messaging, vapidKey, configNeeded } = await initFirebaseClient();

    // If Firebase config is not added yet, inform caller
    if (configNeeded || !messaging) {
      return {
        success: false,
        status: 'config_needed',
        message: 'Firebase keys not yet configured in .env. Please add FIREBASE_PROJECT_ID and FIREBASE_API_KEY.',
      };
    }

    // Ensure firebase service worker is registered
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    if (!token) {
      throw new Error('No FCM registration token received.');
    }

    // Register token with backend
    await api.post('/notifications/fcm-token', {
      token,
      deviceInfo: navigator.userAgent,
    });

    return { success: true, token, status: 'granted' };
  } catch (err) {
    console.error('[Firebase] requestFcmRegistration error:', err);
    return { success: false, error: err.message, status: 'error' };
  }
};

/**
 * Attaches a foreground listener for real-time messages
 */
export const subscribeToForegroundMessages = async (onMessageCallback) => {
  try {
    const { messaging } = await initFirebaseClient();
    if (!messaging) return null;

    return onMessage(messaging, (payload) => {
      console.log('[Firebase] Foreground push received:', payload);
      if (typeof onMessageCallback === 'function') {
        onMessageCallback(payload);
      }
    });
  } catch (err) {
    console.warn('[Firebase] Could not subscribe to foreground messages:', err.message);
    return null;
  }
};
