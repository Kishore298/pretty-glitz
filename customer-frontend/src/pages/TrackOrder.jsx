import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck,
  CheckCircle2,
  ExternalLink,
  Search,
  BellRing,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import api from '../utils/api';
import {
  requestCustomerNotificationPermission,
  linkOrderToCustomerFcm,
} from '../firebase';
import { getWhatsAppUrl } from '../config/constants';

const STEPS = [
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Verified and queued for atelier processing' },
  { key: 'PROCESSING', label: 'In Production / Assembling', desc: 'Handcrafted items being prepared & quality checked' },
  { key: 'DISPATCHED', label: 'Dispatched & In Transit', desc: 'Handed over to courier partner' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Safely delivered to customer address' },
];

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('id') || searchParams.get('orderId') || '';

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Push notification state
  const [pushStatus, setPushStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [pushEnabling, setPushEnabling] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      fetchOrderTracking(initialOrderId);
    }
  }, [initialOrderId]);

  const fetchOrderTracking = async (idToSearch) => {
    if (!idToSearch || !idToSearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/track/${encodeURIComponent(idToSearch.trim())}`);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
        // Automatically link this order to existing FCM token if permission was already granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          linkOrderToCustomerFcm(res.data.order.orderId);
        }
      } else {
        setError('Order not found. Please verify your Order ID.');
        setOrder(null);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError(err.response?.data?.message || 'Could not find tracking details for this order.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    setSearchParams({ id: orderIdInput.trim() });
    fetchOrderTracking(orderIdInput.trim());
  };

  const handleEnablePush = async () => {
    if (!order) return;
    setPushEnabling(true);
    try {
      const result = await requestCustomerNotificationPermission({
        orderId: order.orderId,
      });

      if (result.success) {
        setPushStatus('granted');
        setPushSuccess(true);
      } else {
        alert(result.message || 'Notification permission was not granted. Please allow notifications in browser settings.');
      }
    } catch (err) {
      console.error('Push registration error:', err);
    } finally {
      setPushEnabling(false);
    }
  };

  // Determine current step index (0 to 3)
  const getStepProgress = (status) => {
    if (!status) return 0;
    if (status === 'CONFIRMED') return 0;
    if (status === 'PROCESSING') return 1;
    if (status === 'DISPATCHED') return 2;
    if (status === 'DELIVERED') return 3;
    if (status === 'CANCELLED') return -1;
    return 0; // PENDING / PENDING_WHATSAPP
  };

  const currentStepIdx = order ? getStepProgress(order.status) : 0;

  return (
    <div
      className="app-page-container"
      style={{
        minHeight: '85vh',
        background: 'var(--bg-main, #0D0C13)',
        color: 'var(--text-primary, #FAF9FC)',
        paddingTop: 'calc(var(--nav-height, 76px) + 20px)',
        paddingBottom: 60,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: 'rgba(236, 22, 140, 0.12)',
              border: '1px solid rgba(236, 22, 140, 0.25)',
              color: 'var(--accent-pink, #EC168C)',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            <Truck size={14} />
            Live Shipment Tracker
          </div>
          <h1
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '2.1rem',
              fontWeight: 800,
              margin: '0 0 8px',
              background: 'linear-gradient(135deg, #FAF9FC 40%, #D4CEE0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Track Your Order
          </h1>
          <p style={{ color: 'var(--text-secondary, #ACA6B8)', fontSize: '0.92rem', margin: 0 }}>
            Enter your Order ID (from WhatsApp or invoice) to see live fulfillment and parcel tracking.
          </p>
        </div>

        {/* Order Search Box */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            gap: 10,
            background: 'var(--card-bg, #151420)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.18))',
            borderRadius: 16,
            padding: 8,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: 12 }}>
            <Search size={18} style={{ color: 'var(--text-secondary, #ACA6B8)', marginRight: 10 }} />
            <input
              type="text"
              required
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. PG-6A4B8C"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary, #FAF9FC)',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 4px 14px rgba(236, 22, 140, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 14,
              padding: '16px 20px',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Tracking Details View */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'var(--card-bg, #151420)',
              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
              marginBottom: 28,
            }}
          >
            {/* Order Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                paddingBottom: 20,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                    color: 'var(--text-secondary, #ACA6B8)',
                    marginBottom: 4,
                  }}
                >
                  Order Identification
                </div>
                <div
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#FAF9FC',
                    letterSpacing: '0.04em',
                  }}
                >
                  #{order.orderId}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #ACA6B8)', marginTop: 4 }}>
                  Recipient: <strong style={{ color: '#FAF9FC' }}>{order.customerName}</strong> {order.customerCity ? `(${order.customerCity})` : ''}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: 999,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background:
                      order.status === 'DELIVERED'
                        ? 'rgba(16, 185, 129, 0.16)'
                        : order.status === 'DISPATCHED'
                        ? 'rgba(59, 130, 246, 0.16)'
                        : order.status === 'CANCELLED'
                        ? 'rgba(239, 68, 68, 0.16)'
                        : 'rgba(201, 168, 76, 0.16)',
                    color:
                      order.status === 'DELIVERED'
                        ? '#10B981'
                        : order.status === 'DISPATCHED'
                        ? '#60A5FA'
                        : order.status === 'CANCELLED'
                        ? '#EF4444'
                        : '#C9A84C',
                    border: '1px solid currentColor',
                  }}
                >
                  {order.status}
                </span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #ACA6B8)', marginTop: 6 }}>
                  Total: <strong style={{ color: '#FAF9FC' }}>₹{order.totalAmount}</strong>
                </div>
              </div>
            </div>

            {/* Courier Dispatch Card if available */}
            {order.trackingId && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(138, 43, 226, 0.08))',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 700,
                      color: '#60A5FA',
                      marginBottom: 2,
                    }}
                  >
                    Courier Partner: {order.courierPartner || 'ST Courier'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#FAF9FC',
                      letterSpacing: '0.04em',
                    }}
                  >
                    AWB / Tracking ID: {order.trackingId}
                  </div>
                </div>

                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 12,
                      background: '#3B82F6',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    Track on Courier Site
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            )}

            {/* Stepper Timeline */}
            <div style={{ marginBottom: 28, padding: '8px 0' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginBottom: 20,
                }}
              >
                Fulfillment Timeline
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {STEPS.map((step, idx) => {
                  const isDone = currentStepIdx >= idx && order.status !== 'CANCELLED';
                  const isCurrent = currentStepIdx === idx && order.status !== 'CANCELLED';

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        position: 'relative',
                      }}
                    >
                      {/* Step Circle */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isDone
                            ? '#10B981'
                            : isCurrent
                            ? 'var(--accent-pink, #EC168C)'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          flexShrink: 0,
                          boxShadow: isDone || isCurrent ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                          zIndex: 2,
                        }}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>

                      {/* Step content */}
                      <div style={{ flex: 1, paddingTop: 6 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.94rem',
                            color: isDone || isCurrent ? '#FAF9FC' : 'var(--text-secondary, #ACA6B8)',
                          }}
                        >
                          {step.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary, #ACA6B8)',
                            marginTop: 2,
                          }}
                        >
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PUSH NOTIFICATION PROMPT FOR CUSTOMER */}
            <div
              style={{
                background: 'rgba(236, 22, 140, 0.08)',
                border: '1px solid rgba(236, 22, 140, 0.25)',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(236, 22, 140, 0.16)',
                    color: 'var(--accent-pink, #EC168C)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BellRing size={22} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#FAF9FC',
                      marginBottom: 2,
                    }}
                  >
                    {pushStatus === 'granted' || pushSuccess
                      ? 'Live Push Alerts Enabled for this Order!'
                      : 'Get Live Order Updates on this Device'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #ACA6B8)' }}>
                    {pushStatus === 'granted' || pushSuccess
                      ? `We will send real-time push notifications to this device when #${order.orderId} moves to Dispatched or Delivered.`
                      : 'Never miss a delivery update. Receive instant push notifications the moment your parcel is dispatched.'}
                  </div>
                </div>
              </div>

              {pushStatus !== 'granted' && !pushSuccess && (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushEnabling}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: pushEnabling ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(236, 22, 140, 0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pushEnabling ? 'Enabling...' : 'Enable Push Alerts'}
                </button>
              )}
            </div>

            {/* Order Items Preview */}
            {order.items && order.items.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary, #ACA6B8)',
                    marginBottom: 12,
                  }}
                >
                  Order Items ({order.items.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 8,
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FAF9FC' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #ACA6B8)' }}>
                            Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''} {item.colorName ? `• Color: ${item.colorName}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-gold, #C9A84C)', fontSize: '0.92rem' }}>
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* WhatsApp Support Bar */}
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-secondary, #ACA6B8)',
            fontSize: '0.88rem',
          }}
        >
          Need urgent assistance with your shipment?{' '}
          <a
            href={getWhatsAppUrl('Hi PrettyGlitz team, I have a question regarding my order.')}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#25D366',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MessageCircle size={15} />
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
