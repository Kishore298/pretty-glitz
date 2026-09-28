import React, { useContext, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    address: '',
    city: '',
    pincode: '',
    notes: ''
  });

  const [redirecting, setRedirecting] = useState(false);

  // If not logged in, redirect
  if (!user) {
    return <Navigate to="/login?redirect=/checkout" />;
  }
  
  if (cartItems.length === 0 && !redirecting) {
    return <Navigate to="/cart" />;
  }

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const constructWhatsAppMessage = () => {
    let msg = `*New Order*\n\n`;
    msg += `*Customer:* ${formData.name}\n`;
    msg += `*Mobile:* +91 ${formData.mobile}\n\n`;
    
    msg += `*Products:*\n`;
    cartItems.forEach((item, index) => {
      msg += `\n${index + 1}. ${item.product.name}\n`;
      if (item.size) {
        msg += `   Size: ${item.size}\n`;
      }
      msg += `   Quantity: ${item.quantity}\n`;
      msg += `   Price: ₹${item.product.price}\n`;
    });

    msg += `\n*Total:* ₹${getCartTotal()}\n\n`;
    
    msg += `*Delivery Details:*\n`;
    msg += `Address: ${formData.address}\n`;
    msg += `City: ${formData.city}\n`;
    msg += `Pincode: ${formData.pincode}\n`;
    if (formData.notes) {
      msg += `\nNotes: ${formData.notes}\n`;
    }

    return encodeURIComponent(msg);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    
    const message = constructWhatsAppMessage();
    const phone = "919876543210"; // Placeholder for actual business WhatsApp

    // Detect Mobile vs Desktop for accurate routing
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    let whatsappUrl = '';
    if (isMobile) {
      whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    } else {
      whatsappUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
    }

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    // Clear cart and show the true success state
    clearCart();
    setRedirecting(true);
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full bg-white p-12 text-center shadow-xl shadow-gray-200/50 border border-gray-100 rounded-sm">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-5xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-widest uppercase">Almost Done!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your order details are ready in WhatsApp. <br/>
            <strong className="text-gray-900">Please press Send in WhatsApp to complete your order.</strong>
          </p>
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-900 transition border-b-2 border-transparent hover:border-gray-900 pb-1"
          >
            Return to Store
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 tracking-widest uppercase border-b border-gray-200 pb-4">Secure Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Checkout Form */}
          <div className="flex-1">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
              
              <div className="bg-white shadow-sm border border-gray-100 p-8 rounded-sm">
                <h2 className="text-lg font-semibold text-gray-900 tracking-widest uppercase mb-6 border-b border-gray-100 pb-4">Customer Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded focus:border-gray-900 focus:ring-0 py-3 px-4 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Mobile Number</label>
                    <input type="text" name="mobile" required readOnly value={formData.mobile} className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded py-3 px-4 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-100 p-8 rounded-sm">
                <h2 className="text-lg font-semibold text-gray-900 tracking-widest uppercase mb-6 border-b border-gray-100 pb-4">Delivery Details</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Full Address</label>
                    <textarea name="address" required rows="3" value={formData.address} onChange={handleChange} className="w-full border border-gray-300 rounded focus:border-gray-900 focus:ring-0 py-3 px-4 transition"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">City</label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full border border-gray-300 rounded focus:border-gray-900 focus:ring-0 py-3 px-4 transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Pincode</label>
                      <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} className="w-full border border-gray-300 rounded focus:border-gray-900 focus:ring-0 py-3 px-4 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Additional Notes <span className="lowercase normal-case font-normal text-gray-400">(Optional)</span></label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific instructions for delivery" className="w-full border border-gray-300 rounded focus:border-gray-900 focus:ring-0 py-3 px-4 transition" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white shadow-sm border border-gray-100 p-8 rounded-sm sticky top-32">
              <h2 className="text-lg font-semibold text-gray-900 tracking-widest uppercase mb-6 border-b border-gray-100 pb-4">In Your Bag</h2>
              
              <ul className="divide-y divide-gray-100 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                {cartItems.map((item, idx) => (
                  <li key={idx} className="py-4 flex items-start space-x-4 pr-2">
                    <div className="w-16 h-16 bg-gray-50 rounded-sm overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.product.images?.[0] && <img src={item.product.images[0].url} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product.name}</h4>
                      {item.size && <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>}
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ₹{item.product.price * item.quantity}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 pt-6 mb-8 flex justify-between items-center">
                <span className="text-base font-semibold text-gray-900 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold text-gray-900">₹{getCartTotal()}</span>
              </div>

              <button 
                type="submit"
                form="checkout-form"
                className="w-full bg-[#25D366] text-white py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#128C7E] transition shadow-xl shadow-green-100/50 flex justify-center items-center space-x-3 rounded-sm"
              >
                <span>Place Order on WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
