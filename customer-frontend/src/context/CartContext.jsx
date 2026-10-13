import React, { createContext, useState, useEffect, useContext } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('prettyglitz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('prettyglitz_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  /**
   * addToCart(product, size, quantity, pieceCount, priceOverride)
   * pieceCount: optional, for bangle piece-count pricing
   * priceOverride: the price for the selected pieceCount
   */
  const addToCart = (product, size, quantity, pieceCount = null, priceOverride = null) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item =>
        item.product._id === product._id &&
        item.size === size &&
        item.pieceCount === pieceCount
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }

      return [...prev, {
        product,
        size,
        quantity,
        pieceCount,
        // Store resolved price so cart is stable even if product price changes
        price: priceOverride !== null ? priceOverride : product.price,
      }];
    });
  };

  const updateQuantity = (productId, size, quantity, pieceCount = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, pieceCount);
      return;
    }
    setCartItems(prev => prev.map(item =>
      (item.product._id === productId && item.size === size && item.pieceCount === pieceCount)
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId, size, pieceCount = null) => {
    setCartItems(prev => prev.filter(item =>
      !(item.product._id === productId && item.size === size && item.pieceCount === pieceCount)
    ));
  };

  const isInCart = (productId, size = null, pieceCount = null) => {
    return cartItems.some(item =>
      item.product._id === productId &&
      (size === null || item.size === size) &&
      (pieceCount === null || item.pieceCount === pieceCount)
    );
  };

  const getCartItemQuantity = (productId, size = null, pieceCount = null) => {
    const item = cartItems.find(item =>
      item.product._id === productId &&
      (size === null || item.size === size) &&
      (pieceCount === null || item.pieceCount === pieceCount)
    );
    return item ? item.quantity : 0;
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + ((item.price || item.product.price) * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeFromCart, clearCart,
      getCartTotal, getCartCount, isInCart, getCartItemQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
