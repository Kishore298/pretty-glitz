import React, { useContext, useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { motion } from 'framer-motion';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

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
      if (item.product.inStock === false) {
        msg += `   Status: OUT OF STOCK\n`;
      }
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

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    background: 'var(--input-bg)', border: `1px solid var(--border-strong)`,
    color: 'var(--text)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
  };

  if (redirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderRadius: 24, padding: '64px 40px', maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px var(--shadow)' }}>
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
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="separator" />
          <Link to="/cart">Cart</Link>
          <ChevronRight size={14} className="separator" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>Checkout</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, borderBottom: `1px solid var(--border)`, paddingBottom: 16 }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Secure Checkout
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
            <ShieldCheck size={16} style={{ color: '#10B981' }} />
            256-bit Secure
          </div>
        </div>

        {/* Visual Step Indicator for WhatsApp flow */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          maxWidth: 600, margin: '0 auto 48px', position: 'relative',
          background: 'var(--bg-secondary)', padding: '24px 32px', borderRadius: 16
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, flex: 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>1</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</span>
          </div>
          
          <div style={{ flex: 1, height: 2, background: 'var(--border-strong)', margin: '0 16px', alignSelf: 'flex-start', marginTop: 15 }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, flex: 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--border-strong)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>2</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp</span>
          </div>
          
          <div style={{ flex: 1, height: 2, background: 'var(--border-strong)', margin: '0 16px', alignSelf: 'flex-start', marginTop: 15 }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, flex: 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--border-strong)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>3</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
          
          <div style={{ flex: '1 1 600px' }}>
            <form id="checkout-form" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, padding: 32 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid var(--border)`, paddingBottom: 16 }}>Customer Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Mobile Number</label>
                    <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} placeholder="10-digit number" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, padding: 32 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid var(--border)`, paddingBottom: 16 }}>Delivery Details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Full Address</label>
                    <textarea name="address" required rows="3" value={formData.address} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>City</label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pincode</label>
                      <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Additional Notes <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(Optional)</span></label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific instructions..." style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div style={{ flex: '1 1 350px', maxWidth: 450 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, padding: 32, position: 'sticky', top: 120 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid var(--border)`, paddingBottom: 16 }}>In Your Bag</h2>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', maxHeight: '40vh', overflowY: 'auto' }} className="no-scrollbar">
                {cartItems.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: idx === cartItems.length - 1 ? 'none' : `1px solid var(--border)` }}>
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                      {item.product.images?.[0] ? (
                        <img src={optimizeImageUrl(item.product.images[0].url, 150)} alt={item.product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="no-image-placeholder">
                          <div className="pg-monogram" style={{ width: 24, height: 24, borderRadius: 4, fontSize: '0.5rem' }}>PG</div>
                        </div>
                      )}
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

              <div style={{ borderTop: `1px solid var(--border)`, paddingTop: 24, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>₹{getCartTotal()}</span>
              </div>
              <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10B981' }}>Calculated on WhatsApp</span>
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
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={12} />
                No payment required until confirmation
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
