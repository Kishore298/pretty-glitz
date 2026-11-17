const admin = require('firebase-admin');
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
        credential = admin.credential.cert(JSON.parse(fileContent));
      }
    } else if (serviceAccountJson) {
      credential = admin.credential.cert(JSON.parse(serviceAccountJson));
    } else if (projectId && clientEmail && rawPrivateKey) {
      // Replace literal escaped \n with actual linebreaks if provided in .env
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
      credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }

    if (credential) {
      firebaseApp = admin.initializeApp({ credential });
      console.log(`[Firebase] Firebase Admin SDK successfully initialized (Project: ${projectId || 'default'}).`);
    } else {
      console.warn('[Firebase] Firebase credentials not configured in .env yet. FCM is ready for keys.');
    }
  } catch (err) {
    console.error('[Firebase] Failed to initialize Firebase Admin SDK:', err.message);
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
 * Returns public Firebase web client credentials for admin frontend
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
 * Dispatch Firebase Cloud Messaging (FCM) push notification to all registered admin devices.
 * Automatically prunes dead/unregistered tokens.
 */
const sendFcmToAllAdmins = async (payload) => {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Skipping FCM dispatch: Firebase Admin credentials not yet provided in .env.');
    return { sent: 0, failed: 0, notConfigured: true };
  }

  try {
    const records = await FcmToken.find({});
    if (!records || records.length === 0) {
      console.log('[Firebase] No registered admin FCM tokens found.');
      return { sent: 0, failed: 0 };
    }

    const tokens = records.map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) return { sent: 0, failed: 0 };

    const title = payload.title || 'PrettyGlitz Store Alert';
    const body = payload.body || 'You have a new update in your admin atelier.';
    const clickUrl = payload.url || '/orders';

    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        url: clickUrl,
        type: payload.type || 'alert',
        orderId: payload.orderId ? String(payload.orderId) : '',
        timestamp: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: clickUrl,
        },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[Firebase] FCM Multicast Results: ${response.successCount} sent, ${response.failureCount} failed.`);

    // Prune stale / unregistered tokens
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
            console.warn(`[Firebase] Delivery failure for token ${tokens[idx].slice(0, 10)}...:`, resp.error?.message);
          }
        }
      });

      if (deadTokens.length > 0) {
        await FcmToken.deleteMany({ token: { $in: deadTokens } });
        console.log(`[Firebase] Pruned ${deadTokens.length} expired FCM token(s).`);
      }
    }

    return {
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (err) {
    console.error('[Firebase] Unexpected error in sendFcmToAllAdmins:', err);
    return { sent: 0, failed: 0, error: err.message };
  }
};

module.exports = {
  initFirebase,
  isFirebaseConfigured,
  getFirebasePublicConfig,
  sendFcmToAllAdmins,
};
