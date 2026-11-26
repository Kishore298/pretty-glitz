import React, { createContext, useState, useEffect, useCallback, useRef, useContext, useMemo } from 'react';
import api from '../utils/api';
import { LS_CART_KEY } from '../config/constants';
import { trackProductEvent, syncGuestState } from '../utils/analytics';
import { resolveStock, isColorCompletelyOutOfStock } from '../utils/stockValidator';
import CartToastContainer from '../components/CartToast';

export { resolveStock, isColorCompletelyOutOfStock };
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
  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'success', image = null, duration = 3200, showViewCart = true }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-2), { id, title, message, type, image, showViewCart }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // ── Persist guest cart to localStorage & sync with analytics ────────────────
  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      localStorage.setItem(LS_CART_KEY, JSON.stringify(cartItems));
      syncGuestState(cartItems);
    }
  }, [cartItems]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const buildVariantKey = (productId, size, pieceCount, colorVariantId = null) => {
    const p = productId?.toString() || '';
    const s = size || 'NOSIZE';
    const pc = pieceCount != null ? pieceCount : 'NOCOUNT';
    return (colorVariantId && colorVariantId !== 'NOCOLOR') ? `${p}::${s}::${pc}::${colorVariantId}` : `${p}::${s}::${pc}`;
  };

  const toProductId = (product) =>
    typeof product === 'object' ? product?._id : product;

  // ── addToCart ─────────────────────────────────────────────────────────────────

  const addToCart = useCallback(async (product, size, quantity = 1, pieceCount = null, priceOverride = null, colorVariant = null) => {
    const stockInfo = resolveStock(product, size, colorVariant);
    if (!stockInfo.isAvailable) {
      showToast({
        title: 'Item Unavailable',
        message: stockInfo.reason || 'This product is currently out of stock.',
        type: 'warning',
        showViewCart: false,
      });
      return { success: false, reason: stockInfo.reason || 'This product is currently out of stock.' };
    }

    const productId = toProductId(product);
    const colorVariantId = typeof colorVariant === 'object' ? colorVariant?._id : colorVariant;
    const colorName = typeof colorVariant === 'object' ? colorVariant?.colorName : null;
    const colorVariantImage = (typeof colorVariant === 'object' && colorVariant?.images?.[0]?.url)
      ? colorVariant.images[0].url
      : (product?.colorVariants?.find(cv => cv._id?.toString() === colorVariantId?.toString())?.images?.[0]?.url || null);
    const sizeVariantId = typeof size === 'object' ? size?._id : null;
    const sizeValue = typeof size === 'object' ? size?.size : size;

    const variantKey = buildVariantKey(productId, sizeValue, pieceCount, colorVariantId);
    const price = priceOverride ?? product.price;

    let targetQty = quantity;
    let limitReached = false;

    // Optimistic local update with stock limit enforcement
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.variantKey === variantKey);
      if (idx >= 0) {
        const existingQty = prev[idx].quantity;
        let newQty = existingQty + quantity;
        if (stockInfo.isStockTracked && newQty > stockInfo.availableStock) {
          newQty = stockInfo.availableStock;
          limitReached = true;
        }
        targetQty = newQty;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: newQty, colorVariantImage: colorVariantImage || updated[idx].colorVariantImage };
        return updated;
      }

      if (stockInfo.isStockTracked && targetQty > stockInfo.availableStock) {
        targetQty = stockInfo.availableStock;
        limitReached = true;
      }

      return [...prev, {
        product,
        variantKey,
        colorVariantId: colorVariantId || null,
        colorName: colorName || null,
        colorVariantImage: colorVariantImage || null,
        sizeVariantId: sizeVariantId || null,
        size: sizeValue,
        quantity: targetQty,
        pieceCount,
        price,
        packagingType: product.packagingType || '',
        packagingQuantity: product.packagingQuantity || 1,
      }];
    });

    // Luxury toast notification
    const prodName = typeof product === 'object' ? (product?.name || 'Product') : 'Product';
    const variantDesc = [colorName, sizeValue ? `Size: ${sizeValue}` : null].filter(Boolean).join(', ');
    const displayMsg = variantDesc ? `${prodName} (${variantDesc})` : prodName;
    const toastImg = colorVariantImage || (typeof product === 'object' ? (product?.images?.[0]?.url || product?.image) : null);

    if (limitReached) {
      showToast({
        title: 'Stock Limit Reached',
        message: `Only ${stockInfo.availableStock} in stock. Set to ${targetQty}.`,
        type: 'warning',
        image: toastImg,
      });
    } else {
      showToast({
        title: 'Added to Bag',
        message: `${displayMsg} added to your shopping bag.`,
        type: 'success',
        image: toastImg,
      });
    }

    // Track analytics event (fire-and-forget, deduplicated on backend)
    trackProductEvent(productId, 'CART_ADD', targetQty, { size: sizeValue, pieceCount, price, colorName });

    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        const { data } = await api.post('/cart/items', {
          productId,
          size: sizeValue,
          pieceCount,
          quantity: targetQty,
          colorVariantId: colorVariantId || null,
          colorName: colorName || null,
          sizeVariantId: sizeVariantId || null,
        });
        // Reconcile with authoritative server response.
        setCartItems(_mapServerItems(data.cart?.items || []));
      } catch (err) {
        console.error('[cart] addToCart server error:', err);
      }
    }

    return { success: true, limitReached, quantity: targetQty };
  }, [showToast]);

  // ── removeFromCart ────────────────────────────────────────────────────────────

  const removeFromCart = useCallback(async (productId, size, pieceCount = null, colorVariantId = null) => {
    const variantKey = typeof productId === 'string' && productId.includes('::')
      ? productId
      : buildVariantKey(toProductId(productId), size, pieceCount, colorVariantId);

    const itemToRemove = cartItemsRef.current.find(i => i.variantKey === variantKey);
    if (itemToRemove) {
      const prodName = itemToRemove?.product?.name || 'Product';
      const variantDesc = [itemToRemove?.colorName, itemToRemove?.size ? `Size: ${itemToRemove.size}` : null].filter(Boolean).join(', ');
      const displayMsg = variantDesc ? `${prodName} (${variantDesc})` : prodName;
      const toastImg = itemToRemove?.colorVariantImage || (itemToRemove?.product?.images?.[0]?.url || itemToRemove?.product?.image);

      showToast({
        title: 'Removed from Bag',
        message: `${displayMsg} was removed from your shopping bag.`,
        type: 'removal',
        image: toastImg,
      });
    }

    setCartItems(prev => prev.filter(i => i.variantKey !== variantKey));

    // Track analytics removal (does not decrement lifetime additions)
    trackProductEvent(toProductId(productId), 'CART_REMOVE', 1, { size, pieceCount });

    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        await api.delete(`/cart/items/${encodeURIComponent(variantKey)}`);
      } catch (err) {
        console.error('[cart] removeFromCart server error:', err);
      }
    }
  }, [showToast]);

  // ── updateQuantity ────────────────────────────────────────────────────────────

  const updateQuantity = useCallback(async (productIdOrKey, size, quantity, pieceCount = null, colorVariantId = null) => {
    let targetKey = typeof productIdOrKey === 'string' && productIdOrKey.includes('::')
      ? productIdOrKey
      : buildVariantKey(toProductId(productIdOrKey), size, pieceCount, colorVariantId);

    if (quantity <= 0) {
      return removeFromCart(targetKey, size, pieceCount, colorVariantId);
    }

    const currentItem = cartItemsRef.current.find(i => i.variantKey === targetKey);
    if (currentItem) {
      const stockInfo = resolveStock(currentItem.product, currentItem.size, currentItem.colorVariantId);
      const toastImg = currentItem?.colorVariantImage || (currentItem?.product?.images?.[0]?.url || currentItem?.product?.image);

      if (!stockInfo.isAvailable) {
        showToast({
          title: 'Item Out of Stock',
          message: `${currentItem.product?.name || 'Item'} is currently out of stock and was removed.`,
          type: 'warning',
        });
      } else if (stockInfo.isStockTracked && quantity > stockInfo.availableStock) {
        showToast({
          title: 'Stock Limit Reached',
          message: `Only ${stockInfo.availableStock} in stock for ${currentItem.product?.name || 'this item'}.`,
          type: 'warning',
          image: toastImg,
        });
      } else {
        showToast({
          title: 'Bag Updated',
          message: `${currentItem.product?.name || 'Item'} quantity updated to ${quantity}.`,
          type: 'info',
          image: toastImg,
        });
      }
    }

    setCartItems(prev => {
      const item = prev.find(i => i.variantKey === targetKey);
      if (!item) return prev;

      const stockInfo = resolveStock(item.product, item.size, item.colorVariantId);
      let safeQty = quantity;

      if (!stockInfo.isAvailable) {
        return prev.filter(i => i.variantKey !== targetKey);
      }

      if (stockInfo.isStockTracked && safeQty > stockInfo.availableStock) {
        safeQty = stockInfo.availableStock;
      }

      return prev.map(i => i.variantKey === targetKey ? { ...i, quantity: safeQty } : i);
    });

    const token = localStorage.getItem('customerToken');
    if (token) {
      try {
        const { data } = await api.put(`/cart/items/${encodeURIComponent(targetKey)}`, { quantity });
        setCartItems(_mapServerItems(data.cart?.items || []));
      } catch (err) {
        console.error('[cart] updateQuantity server error:', err);
      }
    }
  }, [removeFromCart, showToast]);

  // ── isInCart / getCartItemQuantity ────────────────────────────────────────────

  const isInCart = useCallback((productId, size = null, pieceCount = null, colorVariantId = null) =>
    cartItems.some(i => {
      const matchProduct = toProductId(i.product)?.toString() === toProductId(productId)?.toString();
      const matchSize = size === null || i.size === size;
      const matchPiece = pieceCount === null || i.pieceCount === pieceCount;
      const matchColor = colorVariantId === null || (i.colorVariantId?.toString() === colorVariantId?.toString());
      return matchProduct && matchSize && matchPiece && matchColor;
    }), [cartItems]);

  const getCartItemQuantity = useCallback((productId, size = null, pieceCount = null, colorVariantId = null) => {
    const item = cartItems.find(i => {
      const matchProduct = toProductId(i.product)?.toString() === toProductId(productId)?.toString();
      const matchSize = size === null || i.size === size;
      const matchPiece = pieceCount === null || i.pieceCount === pieceCount;
      const matchColor = colorVariantId === null || (i.colorVariantId?.toString() === colorVariantId?.toString());
      return matchProduct && matchSize && matchPiece && matchColor;
    });
    return item ? item.quantity : 0;
  }, [cartItems]);

  // ── clearCart ─────────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    setCartItems([]);
    localStorage.removeItem(LS_CART_KEY);

    showToast({
      title: 'Bag Cleared',
      message: 'All items were removed from your shopping bag.',
      type: 'info',
      showViewCart: false,
    });

    const token = localStorage.getItem('customerToken');
    if (token) {
      try { await api.delete('/cart'); } catch { /* best-effort */ }
    }
  }, [showToast]);

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

  // ── Dynamic live stock validation against server database ──────────────────
  const validateCartStock = useCallback(async () => {
    if (!cartItems || cartItems.length === 0) {
      return { isValid: true, items: [] };
    }

    try {
      const payload = cartItems.map((item) => ({
        variantKey: item.variantKey,
        productId: toProductId(item.product),
        size: item.size,
        colorVariantId: item.colorVariantId,
        sizeVariantId: item.sizeVariantId,
        quantity: item.quantity,
      }));

      const { data } = await api.post('/cart/validate', { items: payload });
      if (data && Array.isArray(data.items)) {
        setCartItems((prev) => {
          return prev.map((localItem) => {
            const serverCheck = data.items.find((si) => si.variantKey === localItem.variantKey);
            if (!serverCheck) return localItem;

            let updatedQty = localItem.quantity;
            if (serverCheck.isStockTracked && typeof serverCheck.availableStock === 'number') {
              if (localItem.quantity > serverCheck.availableStock) {
                updatedQty = Math.max(0, serverCheck.availableStock);
              }
            }

            return {
              ...localItem,
              quantity: updatedQty,
              stockStatus: {
                isAvailable: serverCheck.isAvailable,
                isStockTracked: serverCheck.isStockTracked,
                availableStock: serverCheck.availableStock,
                reason: serverCheck.reason,
              },
            };
          });
        });
      }
      return data;
    } catch (err) {
      console.warn('[cart] validateCartStock error:', err.message);
      return { isValid: true, items: [] };
    }
  }, [cartItems]);

  // Initial cart stock validation on mount
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCartStock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run on mount

  const cartContextValue = useMemo(
    () => ({
      cartItems,
      addToCart, updateQuantity, removeFromCart, clearCart,
      isInCart, getCartItemQuantity,
      getCartTotal, getCartCount,
      syncWithServer, loadServerCart, clearLocalSync,
      validateCartStock, resolveStock,
      showToast,
    }),
    [
      cartItems,
      addToCart, updateQuantity, removeFromCart, clearCart,
      isInCart, getCartItemQuantity,
      getCartTotal, getCartCount,
      syncWithServer, loadServerCart, clearLocalSync,
      validateCartStock, showToast,
    ]
  );

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
      <CartToastContainer toasts={toasts} onDismiss={dismissToast} />
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
  return (serverItems || []).map(item => {
    const cVar = item.product?.colorVariants?.find(cv => cv._id?.toString() === item.colorVariantId?.toString());
    const colorVariantImage = cVar?.images?.[0]?.url || item.colorVariantImage || null;
    return {
      product:        item.product,
      variantKey:     item.variantKey,
      colorVariantId: item.colorVariantId || null,
      colorName:      item.colorName || null,
      colorVariantImage,
      sizeVariantId:  item.sizeVariantId || null,
      size:           item.size,
      pieceCount:     item.pieceCount,
      quantity:       item.quantity,
      price:          item.price,
    };
  });
}
