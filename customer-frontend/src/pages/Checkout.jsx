import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';
import { ChevronRight, ShieldCheck, CheckCircle2, BellRing, Truck, AlertCircle, MapPin, Plus, Check, LogIn } from 'lucide-react';
import { getWhatsAppUrl, IS_WHATSAPP_CONFIGURED } from '../config/constants';
import api from '../utils/api';
import { linkOrderToCustomerFcm, requestCustomerNotificationPermission } from '../firebase';
import AddressModal from '../components/AddressModal';
import AddressCard from '../components/AddressCard';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, validateCartStock } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    notes: '',
  });

  // Saved address selection & management state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [setAsDefault, setSetAsDefault] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      // Check for cached guest address in localStorage
      try {
        const cached = localStorage.getItem('pg_guest_address');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setFormData(prev => ({
              ...prev,
              name: parsed.name || prev.name,
              mobile: parsed.mobile || prev.mobile,
              address: parsed.address || parsed.addressLine || prev.address,
              city: parsed.city || prev.city,
              state: parsed.state || prev.state || 'Tamil Nadu',
              pincode: parsed.pincode || prev.pincode,
            }));
          }
        }
      } catch {
        // silent
      }
      return;
    }

    setLoadingAddresses(true);
    try {
      const res = await api.get('/customer/addresses');
      if (res.data?.success && Array.isArray(res.data.addresses)) {
        const list = res.data.addresses;
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find(a => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr._id);
          setFormData(prev => ({
            ...prev,
            name: defaultAddr.name || prev.name || user.name || '',
            mobile: defaultAddr.mobile || prev.mobile || user.mobile || '',
            address: defaultAddr.addressLine || defaultAddr.address || '',
            city: defaultAddr.city || '',
            state: defaultAddr.state || 'Tamil Nadu',
            pincode: defaultAddr.pincode || '',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            name: prev.name || user.name || '',
            mobile: prev.mobile || user.mobile || '',
          }));
        }
      }
    } catch (err) {
      console.error('Error loading saved addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setFormData(prev => ({
      ...prev,
      name: addr.name || prev.name,
      mobile: addr.mobile || prev.mobile,
      address: addr.addressLine || addr.address || '',
      city: addr.city || '',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '',
    }));
  };

  const handleSetDefaultAddress = async (addr) => {
    try {
      const res = await api.put(`/customer/addresses/${addr._id}/default`);
      if (res.data?.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleAddressSaved = (savedAddr, updatedList) => {
    if (updatedList) {
      setAddresses(updatedList);
    } else {
      fetchAddresses();
    }
    if (savedAddr) {
      handleSelectAddress(savedAddr);
    }
  };

  const [redirecting, setRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [pushStatus, setPushStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [pushEnabling, setPushEnabling] = useState(false);
  const idempotencyKeyRef = useRef('pg_ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));

  // Validate cart stock on mount; redirect if any item is out of stock
  useEffect(() => {
    if (validateCartStock && cartItems.length > 0) {
      validateCartStock().then((res) => {
        if (res && res.isValid === false) {
          navigate('/cart');
        }
      });
    }
  }, [validateCartStock, cartItems.length, navigate]);

  if (cartItems.length === 0 && !redirecting) return <Navigate to="/cart" />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const constructWhatsAppMessage = (orderId) => {
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let msg = `✨ *PRETTYGLITZ — NEW ORDER REQUEST* ✨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🛍️ *Order ID:* #${orderId || 'PG-ORDER'}\n`;
    msg += `📅 *Date:* ${formattedDate}\n\n`;

    msg += `👤 *CUSTOMER DETAILS*\n`;
    msg += `• *Name:* ${formData.name.trim()}\n`;
    msg += `• *Phone:* +91 ${formData.mobile.trim()}\n`;
    msg += `• *Delivery Address:* ${formData.address.trim()}\n`;
    if (formData.city) msg += `• *City:* ${formData.city.trim()}\n`;
    if (formData.pincode) msg += `• *Pincode:* ${formData.pincode.trim()}\n\n`;

    msg += `📦 *ORDER ITEMS*\n`;
    cartItems.forEach((item, index) => {
      const packaging = item.packagingType || item.product?.packagingType
        ? `${item.packagingQuantity || item.product?.packagingQuantity || 1} ${item.packagingType || item.product?.packagingType}`
        : (item.pieceCount ? `${item.pieceCount} Pieces` : null);
      const itemPrice = item.price || item.product?.price || 0;
      const lineTotal = itemPrice * item.quantity;

      msg += `${index + 1}. *${item.product?.name || item.name}*\n`;
      if (item.colorName) msg += `   • Colour: ${item.colorName}\n`;
      if (item.size) msg += `   • Size: ${item.size}\n`;
      if (packaging) msg += `   • Packaging: ${packaging}\n`;
      msg += `   • Qty: ${item.quantity} × ₹${itemPrice} = *₹${lineTotal}*\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *BILLING SUMMARY*\n`;
    msg += `• *Subtotal:* ₹${getCartTotal()}\n`;
    msg += `• *Delivery Charges:* To be confirmed on WhatsApp\n`;
    msg += `• *Total Order Amount:* *₹${getCartTotal()}*\n`;

    if (formData.notes && formData.notes.trim()) {
      msg += `\n📝 *Special Instructions:*\n${formData.notes.trim()}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🙏 *Thank you for shopping with PrettyGlitz!*\n`;
    msg += `_Please press Send above to submit this order directly to our team._`;

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
    setErrorMessage('');

    try {
      // 1. Authoritative Backend Stock Validation & Persistence before opening WhatsApp
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

      // Link order to customer FCM token for push notifications on status & tracking updates
      try {
        linkOrderToCustomerFcm(orderId, formData.mobile);
      } catch {
        // Non-critical
      }

      // 2. Format WhatsApp message containing the exact Order ID
      const message = constructWhatsAppMessage(orderId);
      const whatsappUrl = getWhatsAppUrl(decodeURIComponent(message));
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }

      // 3. Set redirecting confirmation screen
      setRedirecting(true);
    } catch (err) {
      console.error('[Checkout] Order submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Unable to create order. Please try again.';
      setErrorMessage(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: 24 }}>
            Your order details are pre-filled in WhatsApp.<br />
            <strong style={{ color: 'var(--text)' }}>Please press &quot;Send&quot; in WhatsApp to submit your order request.</strong>
          </p>

          {/* Push Notification Opt-In for Live Order Tracking */}
          <div
            style={{
              background: 'rgba(236, 22, 140, 0.08)',
              border: '1px solid rgba(236, 22, 140, 0.22)',
              borderRadius: 16,
              padding: '16px',
              marginBottom: 22,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(236, 22, 140, 0.15)',
                color: 'var(--accent-pink, #EC168C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BellRing size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {pushStatus === 'granted' ? '🔔 Live Order Push Alerts Enabled' : '🔔 Get Live Shipment & Dispatch Alerts'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {pushStatus === 'granted'
                  ? `You will receive live push notifications on this device when order #${createdOrderId} is dispatched!`
                  : 'Receive real-time push alerts when tracking details are added or status changes.'}
              </div>
            </div>
            {pushStatus !== 'granted' && (
              <button
                type="button"
                onClick={async () => {
                  setPushEnabling(true);
                  try {
                    const res = await requestCustomerNotificationPermission({
                      mobile: formData.mobile,
                      orderId: createdOrderId,
                    });
                    if (res.success) {
                      setPushStatus('granted');
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setPushEnabling(false);
                  }
                }}
                disabled={pushEnabling}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: pushEnabling ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {pushEnabling ? 'Enabling...' : 'Enable Alerts'}
              </button>
            )}
          </div>

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

            <Link
              to="/account"
              onClick={() => clearCart()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                background: 'rgba(201, 168, 76, 0.1)',
                border: '1px solid rgba(201, 168, 76, 0.25)',
                color: '#C9A84C',
                fontWeight: 700,
                fontSize: '0.86rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Truck size={16} />
              View My Orders & Tracking
            </Link>

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
    <div className="checkout-page" style={{ paddingBottom: 100 }}>
      <div className="app-page-container" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Breadcrumb Pill */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={11} className="separator" />
          <Link to="/cart">Cart</Link>
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
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 24,
                  color: '#EF4444',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Order Notice</div>
                  <div>{errorMessage}</div>
                  <div style={{ marginTop: 8 }}>
                    <Link to="/cart" style={{ color: '#EF4444', fontWeight: 700, textDecoration: 'underline' }}>
                      ← Return to bag to review and update items
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Sign-in Hint */}
            {!user && (
              <div
                style={{
                  background: 'rgba(201, 168, 76, 0.08)',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LogIn size={18} color="#C9A84C" />
                  <div style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
                    Have an account with saved addresses?
                  </div>
                </div>
                <Link
                  to="/login?redirect=/checkout"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #C4386C, #8A2BE2)',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Log In with OTP
                </Link>
              </div>
            )}

            <form id="checkout-form" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* ── Scenario A: Customer has saved addresses ───────────────────────── */}
              {user && addresses.length > 0 ? (
                <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10, borderBottom: `1px solid var(--border)`, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: 'rgba(196, 56, 108, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)',
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Select Delivery Address
                        </h2>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          Delivering to selected address
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: 'var(--accent-gradient)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 3px 12px rgba(196, 56, 108, 0.25)',
                      }}
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  </div>

                  {/* List of saved addresses with radio selection */}
                  {loadingAddresses ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Loading saved addresses...
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
                      {addresses.map((addr) => (
                        <AddressCard
                          key={addr._id}
                          address={addr}
                          selectable={true}
                          isSelected={selectedAddressId === addr._id}
                          onSelect={handleSelectAddress}
                          onEdit={handleOpenEditAddress}
                          onSetDefault={handleSetDefaultAddress}
                        />
                      ))}
                    </div>
                  )}

                  {/* Selected Address Overview */}
                  {selectedAddressId && (
                    <div
                      style={{
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '0.86rem',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Check size={18} color="#10B981" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 700 }}>Dispatch Target: </span>
                        <span>{formData.name} (+91 {formData.mobile}) — {formData.address}, {formData.city} - {formData.pincode}</span>
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                      Additional Delivery Notes <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="e.g. Ring doorbell, leave with security..."
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                    />
                  </div>
                </div>
              ) : (
                /* ── Scenario B: New customer / no saved addresses ─────────────────── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Customer Information */}
                  <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, padding: '24px 28px' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px', borderBottom: `1px solid var(--border)`, paddingBottom: 14 }}>
                      Recipient Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Recipient Name *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="e.g. Priya Lakshmi"
                          value={formData.name}
                          onChange={handleChange}
                          style={inputStyle}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Mobile Number *</label>
                        <input
                          type="tel"
                          name="mobile"
                          required
                          placeholder="10-digit mobile number"
                          value={formData.mobile}
                          onChange={handleChange}
                          style={inputStyle}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, padding: '24px 28px' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px', borderBottom: `1px solid var(--border)`, paddingBottom: 14 }}>
                      Delivery Location
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          House / Flat / Street / Landmark *
                        </label>
                        <textarea
                          name="address"
                          required
                          rows="3"
                          placeholder="Flat/House No, Building, Street, Landmark"
                          value={formData.address}
                          onChange={handleChange}
                          style={{ ...inputStyle, resize: 'vertical' }}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>City / Town *</label>
                          <input
                            type="text"
                            name="city"
                            required
                            placeholder="e.g. Chennai"
                            value={formData.city}
                            onChange={handleChange}
                            style={inputStyle}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>PIN Code *</label>
                          <input
                            type="text"
                            name="pincode"
                            required
                            maxLength="6"
                            placeholder="6 digits"
                            value={formData.pincode}
                            onChange={handleChange}
                            style={inputStyle}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                          />
                        </div>
                      </div>

                      {/* Profile address save checkbox (if authenticated) */}
                      {user && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                            <input
                              type="checkbox"
                              checked={saveAddressToProfile}
                              onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                              style={{ width: 17, height: 17, accentColor: 'var(--accent)' }}
                            />
                            <span style={{ fontSize: '0.86rem', color: 'var(--text)', fontWeight: 600 }}>
                              Save this address to my profile for future orders
                            </span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                            <input
                              type="checkbox"
                              checked={setAsDefault}
                              onChange={(e) => setSetAsDefault(e.target.checked)}
                              style={{ width: 17, height: 17, accentColor: 'var(--accent)' }}
                            />
                            <span style={{ fontSize: '0.86rem', color: 'var(--text)', fontWeight: 600 }}>
                              Make this my default delivery address
                            </span>
                          </label>
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          Special Instructions <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="Any specific delivery instructions..."
                          style={inputStyle}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                          onBlur={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>

          <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px', position: 'sticky', top: 100 }}>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>In Your Bag</h2>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', maxHeight: '35vh', overflowY: 'auto' }} className="no-scrollbar">
                {cartItems.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 12, padding: '10px 0', alignItems: 'center', borderBottom: idx === cartItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={item.product.images?.[0] ? optimizeImageUrl(item.product.images[0].url, 120) : logoImg}
                        alt={item.product.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = logoImg;
                          e.currentTarget.style.objectFit = 'contain';
                          e.currentTarget.style.padding = '4px';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: item.product.images?.[0] ? 'cover' : 'contain',
                          padding: item.product.images?.[0] ? 0 : '4px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</h4>
                      {item.size && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 1px' }}>Size: {item.size}</p>}
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                      ₹{item.product.price * item.quantity}
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>₹{getCartTotal()}</span>
              </div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#10B981' }}>Calculated on WhatsApp</span>
              </div>

              <button
                type="submit" form="checkout-form"
                style={{
                  width: '100%', padding: '12px 18px', background: '#25D366', color: 'white', border: 'none', borderRadius: 10,
                  fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 6px 20px rgba(37,211,102,0.28)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.38)'; e.currentTarget.style.background = '#128C7E'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.28)'; e.currentTarget.style.background = '#25D366'; }}
              >
                Place Order on WhatsApp
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={12} />
                No payment required until confirmation
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Address Add / Edit Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialData={editingAddress}
        onSaved={handleAddressSaved}
        isCustomerLoggedIn={Boolean(user)}
      />
    </div>
  );
};

export default Checkout;
