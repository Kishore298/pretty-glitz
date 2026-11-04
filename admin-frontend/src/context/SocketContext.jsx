import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from './AuthContext';

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
  const [socket, setSocket] = useState(null);
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
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[SocketContext] Error marking all notifications read:', err.message);
    }
  };

  // Service Worker & Web Push Subscription Helper
  const requestPushSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Web Push is not supported in this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission !== 'granted') {
        toast.error('Notification permission was not granted.');
        return false;
      }

      // Register or ensure SW is active
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const keyRes = await api.get('/notifications/vapid-public-key');
      const vapidKey = keyRes.data?.publicKey;

      if (!vapidKey) {
        toast.error('VAPID public key not configured on server.');
        return false;
      }

      const convertedKey = urlBase64ToUint8Array(vapidKey);
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Send to server
      await api.post('/notifications/subscribe', sub);
      toast.success('Push notifications successfully enabled!');
      return true;
    } catch (err) {
      console.error('[SocketContext] Push registration error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to enable push notifications');
      return false;
    }
  };

  // Check and register SW silently on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[SW] Registration notice:', err.message));
    }
  }, []);

  // Fetch notifications on login
  useEffect(() => {
    if (admin) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [admin, fetchNotifications]);

  // Connect Socket.IO
  useEffect(() => {
    if (!admin) {
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const socketBase =
      process.env.REACT_APP_SOCKET_URL ||
      (process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '')
        : 'http://localhost:5000');

    const s = io(socketBase, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO] Connected to server as admin.');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.IO] Disconnected from server.');
    });

    // Real-Time Event: New Order Request
    s.on('new_order_request', (data) => {
      console.log('[Socket.IO] Real-time order alert received:', data);
      setLatestOrderAlert(data);
      playChime();

      // Update notifications list immediately
      const newNotifItem = {
        _id: `temp_${Date.now()}`,
        type: 'NEW_ORDER_REQUEST',
        title: `New Order: ${data.orderId}`,
        message: `${data.customerName} placed a ₹${data.orderAmount} order (${data.itemsCount || data.items?.length || 1} items)`,
        orderId: data.orderId,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotifItem, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification in console
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = `/orders?id=${data.orderId}`;
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
                {data.orderId} • {data.customerName}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#ACA6B8', marginTop: 2 }}>
                ₹{data.orderAmount} • {data.itemsCount || data.items?.length || 1} items
              </div>
            </div>
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );
    });

    // Real-Time Event: Order Status Update
    s.on('order_status_updated', (data) => {
      fetchNotifications();
      toast.success(`Order ${data.orderId} updated to ${data.status}`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [admin, playChime, fetchNotifications]);

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
        pushStatus,
        requestPushSubscription,
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
