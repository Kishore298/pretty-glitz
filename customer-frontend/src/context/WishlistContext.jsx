import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { LS_WISHLIST_KEY } from '../config/constants';

export const WishlistContext = createContext();

/**
 * WishlistProvider
 *
 * Guest users: wishlist is stored in localStorage only.
 * Authenticated users: wishlist is backed by the server; localStorage is
 *   cleared only after a confirmed HTTP 200 merge response (two-phase commit).
 *
 * Wishlist mutation uses explicit add/remove endpoints (not a toggle) so that
 * retried requests never invert the intended state.
 */
export const WishlistProvider = ({ children }) => {
  // In-memory state: array of product objects or product IDs.
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false); // prevents double-sync on strict-mode mount

  // ── Persist guest wishlist to localStorage on every change (unauthenticated) ──
  useEffect(() => {
    // Only persist locally when there is no server token.
    const token = localStorage.getItem('customerToken');
    if (!token) {
      localStorage.setItem(LS_WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Extract a consistent string ID from a product object or plain ID string. */
  const toId = (item) => (typeof item === 'object' ? item?._id : item)?.toString();

  const isInWishlist = useCallback(
    (productId) => wishlist.some((p) => toId(p) === productId?.toString()),
    [wishlist]
  );

  const getWishlistCount = useCallback(() => wishlist.length, [wishlist]);

  // ── Add to wishlist ──────────────────────────────────────────────────────────

  const addToWishlist = useCallback(
    async (product) => {
      const productId = toId(product);
      if (!productId) return;

      // Optimistic update
      setWishlist((prev) => {
        if (prev.some((p) => toId(p) === productId)) return prev;
        return [...prev, product];
      });

      const token = localStorage.getItem('customerToken');
      if (token) {
        try {
          await api.put(`/wishlist/items/${productId}`);
        } catch (err) {
          console.error('[wishlist] add failed, keeping optimistic state:', err);
          // Optimistic state is kept; the item will sync on next app load.
        }
      }
    },
    []
  );

  // ── Remove from wishlist ─────────────────────────────────────────────────────

  const removeFromWishlist = useCallback(
    async (productId) => {
      const id = productId?.toString();
      if (!id) return;

      // Optimistic update
      setWishlist((prev) => prev.filter((p) => toId(p) !== id));

      const token = localStorage.getItem('customerToken');
      if (token) {
        try {
          await api.delete(`/wishlist/items/${id}`);
        } catch (err) {
          console.error('[wishlist] remove failed, keeping optimistic state:', err);
        }
      }
    },
    []
  );

  // ── Toggle (calls explicit add or remove based on current state) ─────────────

  const toggleWishlist = useCallback(
    async (product) => {
      const productId = toId(product);
      if (!productId) return;
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        return false; // removed
      } else {
        await addToWishlist(product);
        return true; // added
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  // ── Server sync on login ──────────────────────────────────────────────────────

  /**
   * Called by AuthContext immediately after a successful login.
   * Merges local guest wishlist with the server record, then clears local
   * storage only on confirmed HTTP 200 (two-phase commit).
   */
  const syncWithServer = useCallback(async (token) => {
    if (syncing || syncedRef.current) return;
    setSyncing(true);
    syncedRef.current = true;

    try {
      const guestItems = (() => {
        try {
          const raw = localStorage.getItem(LS_WISHLIST_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch { return []; }
      })();

      const guestProductIds = guestItems.map(toId).filter(Boolean);
      const idempotencyKey = `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { data } = await api.post(
        '/wishlist/merge',
        { guestProductIds, idempotencyKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Two-phase commit: only clear local storage after confirmed 200.
      localStorage.removeItem(LS_WISHLIST_KEY);
      setWishlist(data.products || []);
    } catch (err) {
      console.warn('[wishlist] sync failed, guest data retained for retry:', err);
      // Do NOT clear localStorage — data is safe for the next attempt.
      syncedRef.current = false;

      // Auto-retry when connection is restored.
      const retry = () => {
        syncedRef.current = false;
        window.removeEventListener('online', retry);
      };
      window.addEventListener('online', retry);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // ── Load server wishlist (for already-authenticated page loads) ───────────────

  const loadServerWishlist = useCallback(async () => {
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data.products || []);
    } catch (err) {
      console.error('[wishlist] loadServerWishlist error:', err);
    }
  }, []);

  // ── Clear (on logout) ─────────────────────────────────────────────────────────

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    localStorage.removeItem(LS_WISHLIST_KEY);
    syncedRef.current = false;
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        getWishlistCount,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        syncWithServer,
        loadServerWishlist,
        clearWishlist,
        syncing,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
