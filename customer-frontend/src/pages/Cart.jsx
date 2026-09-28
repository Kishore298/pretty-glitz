import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-widest uppercase">Cart is Empty</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Looks like you haven't added anything yet. Discover our premium collections to find something beautiful.</p>
          <Link to="/" className="inline-block bg-gray-900 text-white px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-black transition shadow-xl shadow-gray-200">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 tracking-widest uppercase border-b border-gray-200 pb-4">Shopping Bag</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="bg-white shadow-sm border border-gray-100 rounded-sm overflow-hidden">
              <ul className="divide-y divide-gray-100">
                <AnimatePresence>
                  {cartItems.map((item) => {
                    const uniqueKey = `${item.product._id}-${item.size || 'none'}`;
                    return (
                      <motion.li 
                        key={uniqueKey}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3 }}
                        className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
                      >
                        <div className="w-24 h-24 sm:w-28 sm:h-32 bg-gray-50 rounded-sm overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.product.images?.[0] ? (
                            <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-400 h-full w-full flex items-center justify-center">No Img</span>
                          )}
                        </div>

                        <div className="flex-1 w-full">
                          <Link to={`/product/${item.product._id}`} className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition truncate block">
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 mb-2">{item.product.subcategoryId?.name || item.product.category}</p>
                          
                          {item.size && (
                            <p className="text-sm text-gray-500">Size: <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded ml-1">{item.size}</span></p>
                          )}
                          <p className="text-sm font-semibold text-gray-900 mt-3">₹{item.product.price}</p>
                        </div>

                        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                          <div className="flex items-center border border-gray-300 rounded-sm h-10 w-28">
                            <button onClick={() => updateQuantity(item.product._id, item.size, item.quantity - 1)} className="flex-1 h-full text-gray-600 hover:bg-gray-100 transition">-</button>
                            <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product._id, item.size, item.quantity + 1)} className="flex-1 h-full text-gray-600 hover:bg-gray-100 transition">+</button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.product._id, item.size)}
                            className="text-gray-400 hover:text-red-500 transition p-2"
                            title="Remove item"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white shadow-sm border border-gray-100 p-8 rounded-sm sticky top-32">
              <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-widest mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm text-gray-600 border-b border-gray-100 pb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{getCartTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-xs text-gray-400 font-medium">Calculated on WhatsApp</span>
                </div>
              </div>

              <div className="mb-8 flex justify-between items-center">
                <span className="text-base font-semibold text-gray-900 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold text-gray-900">₹{getCartTotal()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-gray-900 text-white py-4 flex items-center justify-center space-x-2 text-sm font-bold tracking-widest uppercase hover:bg-black transition shadow-xl shadow-gray-200"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
                <span>Secure ordering via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
