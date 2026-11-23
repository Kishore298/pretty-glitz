import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isPollingRef = useRef(false);
  const lastKnownIdRef = useRef(null);

  // Fetch full notifications list
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/notifications/customer?limit=25');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[CustomerNotifications] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fast count check for polling
  const pollUnread = useCallback(async () => {
    if (!user || isPollingRef.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    isPollingRef.current = true;
    try {
      const res = await api.get('/notifications/customer/unread-count');
      if (res.data) {
        const { unreadCount: count, latestNotificationId } = res.data;
        if (latestNotificationId && latestNotificationId !== lastKnownIdRef.current) {
          lastKnownIdRef.current = latestNotificationId;
          fetchNotifications();
        } else {
          setUnreadCount(count || 0);
        }
      }
    } catch (err) {
      console.warn('[CustomerNotifications] Poll warning:', err.message);
    } finally {
      isPollingRef.current = false;
    }
  }, [user, fetchNotifications]);

  // Periodic polling interval
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      lastKnownIdRef.current = null;
      return;
    }

    // Initial check
    pollUnread();

    const intervalId = setInterval(pollUnread, 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollUnread();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user, pollUnread]);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/customer/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('[CustomerNotifications] Mark read error:', err.message);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/customer/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[CustomerNotifications] Mark all read error:', err.message);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }
  return context;
};
