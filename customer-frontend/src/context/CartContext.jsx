import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('prettyglitz_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('prettyglitz_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, size, quantity) => {
    setCartItems(prev => {
      // Find variant by product ID AND specific size
      const existingItemIndex = prev.findIndex(item => 
        item.product._id === product._id && item.size === size
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing variant
        const updated = [...prev];
        updated[existingItemIndex].quantity += quantity;
        return updated;
      }

      // Add new variant
      return [...prev, { product, size, quantity }];
    });
  };

  const updateQuantity = (productId, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCartItems(prev => prev.map(item => 
      (item.product._id === productId && item.size === size) 
        ? { ...item, quantity } 
        : item
    ));
  };

  const removeFromCart = (productId, size) => {
    setCartItems(prev => prev.filter(item => 
      !(item.product._id === productId && item.size === size)
    ));
  };

  const clearCart = () => setCartItems([]);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
