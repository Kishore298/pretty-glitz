import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from './AuthContext';
import { requestFcmRegistration, subscribeToForegroundMessages } from '../firebase';

export const SocketContext = createContext(null);

// Utility to convert Base64 URL to Uint8Array for VAPID applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const SocketProvider = ({ children }) => {
  const { admin } = useContext(AuthContext);
  const [socket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestOrderAlert, setLatestOrderAlert] = useState(null);

  // Sound preference state
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    return localStorage.getItem('admin_sound_enabled') !== 'false';
  });

  const setSoundEnabled = (val) => {
    setSoundEnabledState(val);
    localStorage.setItem('admin_sound_enabled', val ? 'true' : 'false');
  };

  // Push notification permission state
  const [pushStatus, setPushStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Audio Context Ref for luxury alert chime
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Synthesize a refined, luxury dual-tone chime (587Hz -> 880Hz)
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880.00 Hz (A5 - harmonic fifth above D)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn('[SocketContext] Web Audio chime playback error:', err);
    }
  }, [soundEnabled, getAudioContext]);

  // Fetch persistent notifications
  const fetchNotifications = useCallback(async () => {
    if (!admin) return;
    try {
      const res = await api.get('/notifications?limit=30');
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[SocketContext] Failed to fetch notifications:', err.message);
    }
  }, [admin]);

  // Mark single notification read
  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('[SocketContext] Error marking notification read:', err.message);
    }
  };

  // Mark all notifications read
  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[SocketContext] Error marking all notifications read:', err.message);
    }
  };

  // Delete single notification
  const deleteNotification = async (id) => {
    try {
      const deletedItem = notifications.find((n) => n._id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deletedItem && !deletedItem.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('[SocketContext] Error deleting notification:', err.message);
      toast.error('Failed to delete notification');
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (err) {
      console.warn('[SocketContext] Error clearing notifications:', err.message);
      toast.error('Failed to clear notifications');
    }
  };

  // Unified Push Notification Subscription (Firebase Cloud Messaging + Web Push)
  const requestPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) {
      toast.error('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission !== 'granted') {
        toast.error('Notification permission was not granted.');
        return false;
      }

      // 1. Attempt Firebase Cloud Messaging (FCM) Registration
      let fcmSuccess = false;
      try {
        const fcmResult = await requestFcmRegistration();
        if (fcmResult.success) {
          fcmSuccess = true;
          console.log('[SocketContext] Registered with Firebase Cloud Messaging!');
        } else if (fcmResult.status === 'config_needed') {
          console.info('[SocketContext] Firebase keys pending in .env; Web Push fallback engaged.');
        }
      } catch (fcmErr) {
        console.warn('[SocketContext] FCM registration attempt notice:', fcmErr.message);
      }

      // 2. Dual Fallback: Register Web Push via sw.js
      let webPushSuccess = false;
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const keyRes = await api.get('/notifications/vapid-public-key');
        const vapidKey = keyRes.data?.publicKey;

        if (vapidKey) {
          const convertedKey = urlBase64ToUint8Array(vapidKey);
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey,
            });
          }
          await api.post('/notifications/subscribe', { subscription: sub });
          webPushSuccess = true;
        }
      } catch (wpErr) {
        console.warn('[SocketContext] Web Push subscription note:', wpErr.message);
      }

      if (fcmSuccess) {
        toast.success('Firebase push notifications enabled!');
        return true;
      } else if (webPushSuccess) {
        toast.success('Push notifications active! (Firebase keys can be added in .env anytime)');
        return true;
      } else {
        toast.success('Notification permission granted.');
        return true;
      }
    } catch (err) {
      console.error('[SocketContext] Push registration error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to enable push notifications');
      return false;
    }
  };

  // Trigger test push notification
  const sendTestPushNotification = async () => {
    try {
      const res = await api.post('/notifications/test-push');
      const fcmCount = res.data?.result?.fcm?.sent || res.data?.fcm?.sent || 0;
      const wpCount = res.data?.result?.webPush?.sent || res.data?.webPush?.sent || 0;
      toast.success(
        `Test push sent! (Delivered to ${fcmCount} Firebase + ${wpCount} browser device${fcmCount + wpCount === 1 ? '' : 's'})`
      );
      return true;
    } catch (err) {
      console.error('[SocketContext] Test push error:', err);
      toast.error(err.response?.data?.message || 'Failed to send test push');
      return false;
    }
  };

  // Check and register Service Workers silently on mount + listen to FCM foreground messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .catch(() => navigator.serviceWorker.register('/sw.js'))
        .catch((err) => console.warn('[SW] Registration notice:', err.message));
    }

    // Attach listener for real-time foreground Firebase messages
    let unsubscribeForeground = null;
    subscribeToForegroundMessages((payload) => {
      const title = payload.notification?.title || payload.data?.title || '✨ PrettyGlitz Alert';
      const body = payload.notification?.body || payload.data?.body || 'New notification received';
      playChime();
      fetchNotifications();
      toast.custom((t) => (
        <div
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: 'linear-gradient(135deg, #1A1118, #2A1525)',
            border: '1px solid rgba(236, 22, 140, 0.45)',
            borderRadius: 14,
            padding: '12px 16px',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🔥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{body}</div>
          </div>
        </div>
      ));
    }).then((unsub) => {
      unsubscribeForeground = unsub;
    });

    return () => {
      if (typeof unsubscribeForeground === 'function') {
        unsubscribeForeground();
      }
    };
  }, [playChime, fetchNotifications]);

  // Fetch notifications on login
  useEffect(() => {
    if (admin) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [admin, fetchNotifications]);

  const lastKnownNotifIdRef = useRef(null);
  const isPollingRef = useRef(false);

  // Core HTTP Polling Handler
  const pollNotifications = useCallback(async () => {
    if (!admin || isPollingRef.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return; // Pause polling when tab is inactive to save resources
    }

    isPollingRef.current = true;
    try {
      // 1. Lightweight count check
      const res = await api.get('/notifications/unread-count');
      if (res.data) {
        const { unreadCount: serverUnread, latestNotificationId, latestNotification } = res.data;

        // If unread count or latest notification changed, fetch recent notifications
        if (latestNotificationId && latestNotificationId !== lastKnownNotifIdRef.current) {
          const isInitial = lastKnownNotifIdRef.current === null;
          lastKnownNotifIdRef.current = latestNotificationId;

          // Fetch full recent notifications
          const fullRes = await api.get('/notifications?limit=25');
          if (fullRes.data && fullRes.data.notifications) {
            setNotifications(fullRes.data.notifications);
            setUnreadCount(fullRes.data.unreadCount || serverUnread || 0);
          }

          // Trigger audible chime and toast alert if it's a new incoming order (not on initial page load)
          if (!isInitial && latestNotification) {
            if (latestNotification.type === 'NEW_ORDER_REQUEST' || latestNotification.orderId) {
              playChime();
              setLatestOrderAlert(latestNotification.data || { orderId: latestNotification.orderId });

              // Dispatch window event so Orders page auto-refreshes seamlessly
              window.dispatchEvent(
                new CustomEvent('pg:order_event', {
                  detail: { type: 'new_order_request', data: latestNotification },
                })
              );

              toast.custom(
                (t) => (
                  <div
                    onClick={() => {
                      toast.dismiss(t.id);
                      window.location.href = `/orders?id=${latestNotification.orderId || ''}`;
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #1C1929, #251D3A)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 20px rgba(236, 22, 140, 0.25)',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      color: '#FAF9FC',
                      fontFamily: 'Inter, sans-serif',
                      minWidth: '320px',
                      maxWidth: '420px',
                      animation: t.visible ? 'custom-enter 0.3s ease' : 'custom-leave 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                      }}
                    >
                      🛍️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            color: '#C9A84C',
                            letterSpacing: '0.02em',
                          }}
                        >
                          New Order Request!
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(236, 22, 140, 0.2)',
                            color: '#EC168C',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          LIVE
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: '#FAF9FC',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {latestNotification.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#ACA6B8', marginTop: 2 }}>
                        {latestNotification.message}
                      </div>
                    </div>
                  </div>
                ),
                { duration: 6000, position: 'top-right' }
              );
            } else if (latestNotification.type === 'ORDER_UPDATE') {
              window.dispatchEvent(
                new CustomEvent('pg:order_event', {
                  detail: { type: 'order_status_updated', data: latestNotification },
                })
              );
            }
          }
        } else {
          // If unread counts differ without new ID (e.g. read status changed)
          setUnreadCount(serverUnread);
        }
      }
      setIsConnected(true);
    } catch (err) {
      console.warn('[Polling] Check warning:', err.message);
    } finally {
      isPollingRef.current = false;
    }
  }, [admin, playChime]);

  // Set up periodic HTTP polling (every 18 seconds) with tab visibility handling
  useEffect(() => {
    if (!admin) {
      setIsConnected(false);
      lastKnownNotifIdRef.current = null;
      return;
    }

    // Initial immediate poll
    pollNotifications();

    const intervalId = setInterval(pollNotifications, 18000);

    // Resume immediately when user focuses back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [admin, pollNotifications]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        latestOrderAlert,
        soundEnabled,
        setSoundEnabled,
        playChime,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        deleteAllNotifications,
        pushStatus,
        requestPushSubscription,
        sendTestPushNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
