const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');
const FcmToken = require('../models/FcmToken');

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK safely with flexible credential sources:
 * 1. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 2. Service account JSON file path: FIREBASE_SERVICE_ACCOUNT_PATH
 * 3. Inlined JSON string: FIREBASE_SERVICE_ACCOUNT_JSON
 */
const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
      return firebaseApp;
    }

    let credential = null;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (serviceAccountPath) {
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(__dirname, '..', serviceAccountPath);
      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        credential = cert(JSON.parse(fileContent));
      }
    } else if (serviceAccountJson) {
      credential = cert(JSON.parse(serviceAccountJson));
    } else if (projectId && clientEmail && rawPrivateKey) {
      // Replace literal escaped \n with actual linebreaks if provided in .env
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
      credential = cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }

    if (credential) {
      firebaseApp = initializeApp({ credential });
      console.log(`[Firebase] Firebase Admin SDK successfully initialized (Project: ${projectId || 'default'}).`);
    } else {
      console.warn('[Firebase] Firebase credentials not configured in .env yet. FCM is ready for keys.');
    }
  } catch (err) {
    console.error('[Firebase] Failed to initialize Firebase Admin SDK:', err.stack || err.message);
  }

  return firebaseApp;
};

// Initialize on module load
initFirebase();

const isFirebaseConfigured = () => {
  if (!firebaseApp) {
    initFirebase();
  }
  return Boolean(firebaseApp);
};

/**
 * Returns public Firebase web client credentials for admin & customer frontends
 */
const getFirebasePublicConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    vapidKey: process.env.FIREBASE_VAPID_KEY || process.env.VAPID_PUBLIC_KEY || '',
    isConfigured: isFirebaseConfigured(),
  };
};

/**
 * Internal helper to send multicast FCM and prune dead/unregistered tokens.
 */
const dispatchMulticast = async (tokens, notificationData) => {
  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0 };
  const app = initFirebase();
  if (!app) return { sent: 0, failed: 0, notConfigured: true };

  const messaging = getMessaging(app);

  const title = notificationData.title || 'PrettyGlitz Notification';
  const body = notificationData.body || '';
  const clickUrl = notificationData.url || '/';
  const icon = notificationData.icon || '/favicon.ico';
  const imageUrl = notificationData.imageUrl || undefined;

  const message = {
    tokens,
    notification: {
      title,
      body,
      ...(imageUrl ? { imageUrl } : {}),
    },
    data: {
      url: clickUrl,
      title,
      body,
      orderId: notificationData.orderId ? String(notificationData.orderId) : '',
      type: notificationData.type || 'alert',
      timestamp: new Date().toISOString(),
      ...(imageUrl ? { imageUrl } : {}),
    },
    webpush: {
      fcmOptions: {
        link: clickUrl,
      },
      notification: {
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
        requireInteraction: Boolean(notificationData.requireInteraction),
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);
  console.log(`[Firebase] FCM Multicast: ${response.successCount} sent, ${response.failureCount} failed.`);

  // Prune dead / invalid registration tokens
  if (response.failureCount > 0) {
    const deadTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          deadTokens.push(tokens[idx]);
        } else {
          console.warn(`[Firebase] Token error (${tokens[idx]?.slice(0, 10)}...):`, resp.error?.message);
        }
      }
    });

    if (deadTokens.length > 0) {
      await FcmToken.deleteMany({ token: { $in: deadTokens } }).catch((e) =>
        console.error('[Firebase] Failed to prune dead tokens:', e.message)
      );
      console.log(`[Firebase] Pruned ${deadTokens.length} expired FCM token(s).`);
    }
  }

  return {
    sent: response.successCount,
    failed: response.failureCount,
  };
};

/**
 * Dispatch FCM push notification to all registered admin devices.
 */
const sendFcmToAllAdmins = async (payload) => {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Skipping admin FCM dispatch: Firebase not configured.');
    return { sent: 0, failed: 0, notConfigured: true };
  }

  try {
    const records = await FcmToken.find({ role: { $in: ['ADMIN', null] } });
    const tokens = records.map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) {
      console.log('[Firebase] No registered admin FCM tokens found.');
      return { sent: 0, failed: 0 };
    }

    return await dispatchMulticast(tokens, {
      ...payload,
      requireInteraction: true,
      url: payload.url || '/orders',
    });
  } catch (err) {
    console.error('[Firebase] Unexpected error in sendFcmToAllAdmins:', err);
    return { sent: 0, failed: 0, error: err.message };
  }
};

/**
 * Dispatch FCM push notification to a specific customer's device(s).
 * Targets customer by orderId, customer phone / mobile, or userId.
 */
const sendFcmToCustomer = async ({ orderId, mobile, userId }, payload) => {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Skipping customer FCM dispatch: Firebase not configured.');
    return { sent: 0, failed: 0, notConfigured: true };
  }

  try {
    const queryConditions = [];
    if (orderId) {
      queryConditions.push({ orderIds: String(orderId).toUpperCase() });
    }
    if (mobile) {
      const cleanMobile = String(mobile).replace(/\D/g, '');
      if (cleanMobile.length >= 10) {
        queryConditions.push({ mobile: { $regex: cleanMobile.slice(-10), $options: 'i' } });
      }
    }
    if (userId) {
      queryConditions.push({ userId });
    }

    if (queryConditions.length === 0) {
      console.log('[Firebase] No target identifier (orderId, mobile, or userId) provided for customer FCM.');
      return { sent: 0, failed: 0 };
    }

    const records = await FcmToken.find({
      role: 'CUSTOMER',
      $or: queryConditions,
    });

    const tokens = records.map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) {
      console.log(`[Firebase] No active customer FCM tokens found for orderId: ${orderId}, mobile: ${mobile}`);
      return { sent: 0, failed: 0 };
    }

    console.log(`[Firebase] Dispatching customer push notification to ${tokens.length} device(s) for order ${orderId}...`);
    return await dispatchMulticast(tokens, {
      ...payload,
      url: payload.url || (orderId ? `/track-order?id=${orderId}` : '/'),
    });
  } catch (err) {
    console.error('[Firebase] Error in sendFcmToCustomer:', err);
    return { sent: 0, failed: 0, error: err.message };
  }
};

/**
 * Custom Broadcast Push notification to Customers, Admins, or Everyone.
 */
const sendFcmCustomBroadcast = async ({ targetAudience = 'CUSTOMERS', title, body, url, icon, imageUrl }) => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase credentials are not configured in backend .env.');
  }

  let filter = {};
  if (targetAudience === 'CUSTOMERS') {
    filter = { role: 'CUSTOMER' };
  } else if (targetAudience === 'ADMINS') {
    filter = { role: { $in: ['ADMIN', null] } };
  } else if (targetAudience === 'ALL') {
    filter = {};
  }

  const records = await FcmToken.find(filter);
  const tokens = records.map((r) => r.token).filter(Boolean);

  if (tokens.length === 0) {
    return { sent: 0, failed: 0, totalRecipients: 0 };
  }

  const result = await dispatchMulticast(tokens, {
    title,
    body,
    url: url || '/',
    icon: icon || '/pretty-glitz-logo.png',
    imageUrl: imageUrl || '',
    type: 'broadcast',
  });

  return {
    ...result,
    totalRecipients: tokens.length,
  };
};

module.exports = {
  initFirebase,
  isFirebaseConfigured,
  getFirebasePublicConfig,
  sendFcmToAllAdmins,
  sendFcmToCustomer,
  sendFcmCustomBroadcast,
};
