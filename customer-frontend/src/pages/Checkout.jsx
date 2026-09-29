import React, { useContext, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    pincode: '',
    notes: ''
  });

  const [redirecting, setRedirecting] = useState(false);


  if (cartItems.length === 0 && !redirecting) return <Navigate to="/cart" />;

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const constructWhatsAppMessage = () => {
    let msg = `*New Order*\n\n*Customer:* ${formData.name}\n*Mobile:* +91 ${formData.mobile}\n\n*Products:*\n`;
    cartItems.forEach((item, index) => {
      msg += `\n${index + 1}. ${item.product.name}\n`;
      if (item.size) msg += `   Size: ${item.size}\n`;
      msg += `   Quantity: ${item.quantity}\n   Price: ₹${item.product.price}\n`;
    });
    msg += `\n*Total:* ₹${getCartTotal()}\n\n*Delivery Details:*\nAddress: ${formData.address}\nCity: ${formData.city}\nPincode: ${formData.pincode}\n`;
    if (formData.notes) msg += `\nNotes: ${formData.notes}\n`;
    return encodeURIComponent(msg);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    const message = constructWhatsAppMessage();
    const phone = "919876543210"; 
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile ? `https://wa.me/${phone}?text=${message}` : `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;
    window.open(whatsappUrl, '_blank');
    clearCart();
    setRedirecting(true);
  };

  const cardBg = isDark ? '#1a1a2a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    background: 'var(--input-bg)', border: `1px solid ${cardBorder}`,
    color: 'var(--text)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
  };

  if (redirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 24, padding: '64px 40px', maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
            <span style={{ fontSize: '2.5rem' }}>📱</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Almost Done!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: 40 }}>
            Your order details are ready in WhatsApp. <br/><strong style={{ color: 'var(--text)' }}>Please press Send in WhatsApp to complete your order.</strong>
          </p>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', borderBottom: '2px solid var(--text)', color: 'var(--text)', paddingBottom: 4, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Return to Store
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text)', marginBottom: 40, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 16 }}>
          Secure Checkout
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
          
          <div style={{ flex: '1 1 600px' }}>
            <form id="checkout-form" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${cardBorder}`, padding: 32 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 16 }}>Customer Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FF1493'} onBlur={e => e.target.style.borderColor = cardBorder} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Mobile Number</label>
                    <input type="text" name="mobile" required readOnly value={formData.mobile} style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                </div>
              </div>

              <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${cardBorder}`, padding: 32 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 16 }}>Delivery Details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Full Address</label>
                    <textarea name="address" required rows="3" value={formData.address} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#FF1493'} onBlur={e => e.target.style.borderColor = cardBorder} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>City</label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FF1493'} onBlur={e => e.target.style.borderColor = cardBorder} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pincode</label>
                      <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FF1493'} onBlur={e => e.target.style.borderColor = cardBorder} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Additional Notes <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(Optional)</span></label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific instructions..." style={inputStyle} onFocus={e => e.target.style.borderColor = '#FF1493'} onBlur={e => e.target.style.borderColor = cardBorder} />
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div style={{ flex: '1 1 350px', maxWidth: 450 }}>
            <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${cardBorder}`, padding: 32, position: 'sticky', top: 120 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 16 }}>In Your Bag</h2>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', maxHeight: '40vh', overflowY: 'auto' }} className="no-scrollbar">
                {cartItems.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: idx === cartItems.length - 1 ? 'none' : `1px solid ${cardBorder}` }}>
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                      {item.product.images?.[0] && <img src={item.product.images[0].url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</h4>
                      {item.size && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 2px' }}>Size: {item.size}</p>}
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                      ₹{item.product.price * item.quantity}
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>₹{getCartTotal()}</span>
              </div>

              <button 
                type="submit" form="checkout-form"
                style={{
                  width: '100%', padding: '18px', background: '#25D366', color: 'white', border: 'none', borderRadius: 12,
                  fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 8px 30px rgba(37,211,102,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,211,102,0.4)'; e.currentTarget.style.background = '#128C7E'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,211,102,0.3)'; e.currentTarget.style.background = '#25D366'; }}
              >
                Place Order on WhatsApp
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
