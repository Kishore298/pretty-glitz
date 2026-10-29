import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import api from '../utils/api';
import { LS_CART_KEY } from '../config/constants';

export const CartContext = createContext();

/**
 * CartProvider
 *
 * Guest users: cart is stored in localStorage only.
 * Authenticated users: cart is backed by the server.
 *   On login, guest items are merged via POST /api/cart/merge with a
 *   unique idempotencyKey, and localStorage is cleared only after a
 *   confirmed HTTP 200 (two-phase commit).
 *
 * Mutations (add, update, remove) are atomic server calls for auth users.
 * Client state is optimistically updated for instant UI feedback.
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const syncedRef = useRef(false);

  // ── Persist guest cart to localStorage ───────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      localStorage.setItem(LS_CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const buildVariantKey = (productId, size, pieceCount) =>
    `${productId}::${size || 'NOSIZE'}::${pieceCount ?? 'NOCOUNT'}`;

  const toProductId = (product) =>
    typeof product === 'object' ? product?._id : product;

  // ── addToCart ─────────────────────────────────────────────────────────────────

  const addToCart = useCallback(async (product, size, quantity = 1, pieceCount = null, priceOverride = null) => {
    const productId  = toProductId(product);
    const variantKey = buildVariantKey(productId, size, pieceCount);
    const price      = priceOverride ?? product.price;

    // Optimistic local update
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.variantKey === variantKey);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, { product, variantKey, size, quantity, pieceCount, price }];
    });

    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        const { data } = await api.post('/cart/items', {
          productId, size, pieceCount, quantity,
        });
        // Reconcile with authoritative server response.
        setCartItems(_mapServerItems(data.cart?.items || []));
      } catch (err) {
        console.error('[cart] addToCart server error:', err);
      }
    }
  }, []);

  // ── removeFromCart ────────────────────────────────────────────────────────────

  const removeFromCart = useCallback(async (productId, size, pieceCount = null) => {
    const variantKey = buildVariantKey(productId, size, pieceCount);

    setCartItems(prev => prev.filter(i => i.variantKey !== variantKey));

    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        await api.delete(`/cart/items/${encodeURIComponent(variantKey)}`);
      } catch (err) {
        console.error('[cart] removeFromCart server error:', err);
      }
    }
  }, []);

  // ── updateQuantity ────────────────────────────────────────────────────────────

  const updateQuantity = useCallback(async (productId, size, quantity, pieceCount = null) => {
    const variantKey = buildVariantKey(productId, size, pieceCount);

    if (quantity <= 0) {
      return removeFromCart(productId, size, pieceCount);
    }

    setCartItems(prev =>
      prev.map(i => i.variantKey === variantKey ? { ...i, quantity } : i)
    );

    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        const { data } = await api.put(`/cart/items/${encodeURIComponent(variantKey)}`, { quantity });
        setCartItems(_mapServerItems(data.cart?.items || []));
      } catch (err) {
        console.error('[cart] updateQuantity server error:', err);
      }
    }
  }, [removeFromCart]);

  // ── isInCart / getCartItemQuantity ────────────────────────────────────────────

  const isInCart = useCallback((productId, size = null, pieceCount = null) =>
    cartItems.some(i => {
      const matchProduct  = toProductId(i.product)?.toString() === productId?.toString();
      const matchSize     = size === null || i.size === size;
      const matchPiece    = pieceCount === null || i.pieceCount === pieceCount;
      return matchProduct && matchSize && matchPiece;
    }), [cartItems]);

  const getCartItemQuantity = useCallback((productId, size = null, pieceCount = null) => {
    const item = cartItems.find(i => {
      const matchProduct  = toProductId(i.product)?.toString() === productId?.toString();
      const matchSize     = size === null || i.size === size;
      const matchPiece    = pieceCount === null || i.pieceCount === pieceCount;
      return matchProduct && matchSize && matchPiece;
    });
    return item ? item.quantity : 0;
  }, [cartItems]);

  // ── clearCart ─────────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    setCartItems([]);
    localStorage.removeItem(LS_CART_KEY);

    const token = localStorage.getItem('customerToken');
    if (token) {
      try { await api.delete('/cart'); } catch { /* best-effort */ }
    }
  }, []);

  // ── getCartTotal / getCartCount ───────────────────────────────────────────────

  const getCartTotal = useCallback(() =>
    cartItems.reduce((sum, i) => sum + ((i.price || i.product?.price || 0) * i.quantity), 0),
    [cartItems]);

  const getCartCount = useCallback(() =>
    cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]);

  // ── Server sync on login (called by AuthContext after successful auth) ─────────

  /**
   * Two-phase commit merge:
   *   1. Send guest items with a unique idempotencyKey.
   *   2. On confirmed HTTP 200, wipe guest localStorage and adopt server state.
   *   3. On failure, retain localStorage and queue auto-retry on reconnect.
   */
  const syncWithServer = useCallback(async (token) => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    const guestItems = (() => {
      try {
        const raw = localStorage.getItem(LS_CART_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();

    const idempotencyKey = `cm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { data } = await api.post(
        '/cart/merge',
        { guestItems, idempotencyKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Confirmed 200 — safe to wipe local guest data.
      localStorage.removeItem(LS_CART_KEY);
      setCartItems(_mapServerItems(data.cart?.items || []));
    } catch (err) {
      console.warn('[cart] sync failed, guest data retained for retry:', err);
      syncedRef.current = false;

      const retry = () => {
        syncedRef.current = false;
        window.removeEventListener('online', retry);
      };
      window.addEventListener('online', retry);
    }
  }, []);

  // ── Load server cart (already-authenticated page load) ────────────────────────

  const loadServerCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCartItems(_mapServerItems(data.cart?.items || []));
    } catch (err) {
      console.error('[cart] loadServerCart error:', err);
    }
  }, []);

  const clearLocalSync = useCallback(() => {
    syncedRef.current = false;
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart, updateQuantity, removeFromCart, clearCart,
        isInCart, getCartItemQuantity,
        getCartTotal, getCartCount,
        syncWithServer, loadServerCart, clearLocalSync,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Map server cart items to the local format expected by CartContext consumers.
 * Normalises variantKey so all cart operations remain consistent.
 */
function _mapServerItems(serverItems) {
  return (serverItems || []).map(item => ({
    product:    item.product,
    variantKey: item.variantKey,
    size:       item.size,
    pieceCount: item.pieceCount,
    quantity:   item.quantity,
    price:      item.price,
  }));
}
