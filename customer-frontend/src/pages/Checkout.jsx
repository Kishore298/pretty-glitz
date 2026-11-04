import React, { useContext, useState, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { motion } from 'framer-motion';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';
import { ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getWhatsAppUrl, IS_WHATSAPP_CONFIGURED } from '../config/constants';
import api from '../utils/api';

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
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const idempotencyKeyRef = useRef('pg_ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));

  if (cartItems.length === 0 && !redirecting) return <Navigate to="/cart" />;

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const constructWhatsAppMessage = (orderId) => {
    let msg = `*New Order Request*\n*Order ID:* ${orderId || 'PENDING'}\n\n*Customer:* ${formData.name}\n*Mobile:* +91 ${formData.mobile}\n\n*Products:*\n`;
    cartItems.forEach((item, index) => {
      msg += `\n${index + 1}. ${item.product.name}\n`;
      if (item.colorName) msg += `   Colour: ${item.colorName}\n`;
      if (item.size) msg += `   Size: ${item.size}\n`;
      if (item.pieceCount) msg += `   Pieces: ${item.pieceCount}\n`;
      msg += `   Quantity: ${item.quantity}\n   Price: ₹${item.price || item.product.price}\n`;
      if (item.product.inStock === false) {
        msg += `   Status: OUT OF STOCK\n`;
      }
    });
    msg += `\n*Total:* ₹${getCartTotal()}\n\n*Delivery Details:*\nAddress: ${formData.address}\nCity: ${formData.city}\nPincode: ${formData.pincode}\n`;
    if (formData.notes) msg += `\nNotes: ${formData.notes}\n`;
    return encodeURIComponent(msg);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!IS_WHATSAPP_CONFIGURED) {
      alert('WhatsApp ordering is temporarily unavailable. Please contact us directly.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Save authoritative Order in MongoDB before redirect
      const payload = {
        customer: formData,
        items: cartItems.map((item) => ({
          productId: item.product?._id || item.product,
          name: item.product?.name,
          price: item.price || item.product?.price,
          quantity: item.quantity,
          colorVariantId: item.colorVariantId || null,
          colorName: item.colorName || null,
          sizeVariantId: item.sizeVariantId || null,
          size: item.size || null,
          pieceCount: item.pieceCount || null,
          image: item.product?.images?.[0]?.url,
          variantKey: item.variantKey,
        })),
        totalAmount: getCartTotal(),
        idempotencyKey: idempotencyKeyRef.current,
      };

      const { data } = await api.post('/orders', payload);
      const orderId = data.orderId || 'PG-ORDER';
      setCreatedOrderId(orderId);

      // 2. Format WhatsApp message containing the exact Order ID
      const message = constructWhatsAppMessage(orderId);
      const whatsappUrl = getWhatsAppUrl(decodeURIComponent(message));
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }

      // 3. Set redirecting screen (WITHOUT wiping cart immediately)
      setRedirecting(true);
    } catch (err) {
      console.error('[Checkout] Order submission error:', err);
      // Fallback: still allow WhatsApp checkout even if server had a momentary network error
      const fallbackOrderId = 'PG-' + Date.now().toString().slice(-6);
      setCreatedOrderId(fallbackOrderId);
      const message = constructWhatsAppMessage(fallbackOrderId);
      const whatsappUrl = getWhatsAppUrl(decodeURIComponent(message));
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
      setRedirecting(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    background: 'var(--input-bg)', border: `1px solid var(--border-strong)`,
    color: 'var(--text)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
  };

  if (redirecting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderRadius: 24, padding: '48px 36px', maxWidth: 540, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px var(--shadow)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '2.5rem' }}>📱</span>
          </div>

          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201, 168, 76, 0.25)', color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', marginBottom: 16 }}>
            Order Request: #{createdOrderId || 'PENDING'}
          </div>

          <h2 style={{ fontSize: '1.7rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Almost Done!
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: 28 }}>
            Your order details are pre-filled in WhatsApp.<br/>
            <strong style={{ color: 'var(--text)' }}>Please press &quot;Send&quot; in WhatsApp to submit your order request.</strong>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => {
                clearCart();
                navigate('/');
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: '#25D366',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(37,211,102,0.3)',
              }}
            >
              ✓ I have sent the message (Complete Order)
            </button>

            <button
              onClick={() => {
                setRedirecting(false);
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              ← Didn&apos;t send? Return to review details &amp; keep cart
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--nav-height, 76px) + 16px)', paddingBottom: 100 }}>
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
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={item.product.images?.[0] ? optimizeImageUrl(item.product.images[0].url, 150) : logoImg}
                        alt={item.product.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = logoImg;
                          e.currentTarget.style.objectFit = 'contain';
                          e.currentTarget.style.padding = '8px';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: item.product.images?.[0] ? 'cover' : 'contain',
                          padding: item.product.images?.[0] ? 0 : '8px',
                        }}
                      />
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
