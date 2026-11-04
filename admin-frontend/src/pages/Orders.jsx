import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  Copy,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

const STATUS_CONFIG = {
  ALL: { label: 'All Orders', color: '#ACA6B8', bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.12)' },
  PENDING_WHATSAPP: {
    label: 'New Requests',
    badge: 'Pending WhatsApp',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmed',
    badge: 'Confirmed',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    icon: CheckCircle,
  },
  DISPATCHED: {
    label: 'Dispatched',
    badge: 'Dispatched',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.35)',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Delivered',
    badge: 'Delivered',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: PackageCheck,
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'Cancelled',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    icon: XCircle,
  },
};

const Orders = () => {
  const [searchParams] = useSearchParams();
  const highlightedIdFromUrl = searchParams.get('id');

  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const selectedOrderRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 25,
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/orders', { params });
      if (res.data && res.data.success) {
        setOrders(res.data.orders || []);
        setStatusCounts(res.data.statusCounts || {});
        setTotalPages(res.data.totalPages || 1);
        setTotalOrders(res.data.total || 0);

        // Auto select if highlighted ID is provided
        if (highlightedIdFromUrl && res.data.orders) {
          const match = res.data.orders.find((o) => o.orderId === highlightedIdFromUrl);
          if (match) setSelectedOrder(match);
        } else if (res.data.orders?.length > 0 && !selectedOrder) {
          setSelectedOrder(res.data.orders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, highlightedIdFromUrl, selectedOrder]);

  // Listen for socket events to auto-refresh orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData) => {
      fetchOrders();
    };

    const handleStatusUpdate = (updateData) => {
      fetchOrders();
    };

    socket.on('new_order_request', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_order_request', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [socket, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openWhatsAppChat = (order) => {
    if (!order || !order.customer?.mobile) return;
    const cleanPhone = order.customer.mobile.replace(/\D/g, '');
    const greeting = encodeURIComponent(
      `Hello ${order.customer.name}! Thank you for your order request (${order.orderId}) on PrettyGlitz. We are reviewing your order of ₹${order.totalAmount}. Let us know if you have any questions!`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${greeting}`, '_blank');
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#FAF9FC',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Orders & Requests
            </h1>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(201, 168, 76, 0.15)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                color: 'var(--accent-gold, #C9A84C)',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {totalOrders} total
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#ACA6B8', fontSize: '0.88rem' }}>
            Manage incoming WhatsApp checkout requests and track fulfillment status
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(201, 168, 76, 0.25)',
            color: '#FAF9FC',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const isActive = statusFilter === key;
          const count =
            key === 'ALL'
              ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
              : statusCounts[key] || 0;

          return (
            <button
              key={key}
              onClick={() => {
                setStatusFilter(key);
                setPage(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 12,
                background: isActive
                  ? config.bg
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? `1px solid ${config.border}`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? config.color : '#ACA6B8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{config.label}</span>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: 10,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: isActive ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#FFFFFF' : '#ACA6B8',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid rgba(201, 168, 76, 0.15)',
          borderRadius: 14,
        }}
      >
        <Search size={18} color="#ACA6B8" />
        <input
          type="text"
          placeholder="Search by Order ID (PG-...), Customer Name, or Phone number..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FAF9FC',
            fontSize: '0.9rem',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ACA6B8',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Split Grid: Order List + Order Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 24,
          minHeight: '600px',
        }}
      >
        {/* Left Column: Orders List (5 cols on desktop) */}
        <div
          style={{
            gridColumn: 'span 5',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#ACA6B8',
                background: 'var(--surface-primary, #14131E)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
              <div>Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#ACA6B8',
                background: 'var(--surface-primary, #14131E)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <ShoppingBag size={32} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: '#FAF9FC', marginBottom: 4 }}>
                No orders found
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                {searchQuery
                  ? 'Try searching with a different term.'
                  : 'Orders placed on the storefront will appear here instantly.'}
              </div>
            </div>
          ) : (
            orders.map((order) => {
              const isSelected = selectedOrder?.orderId === order.orderId;
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_WHATSAPP;

              return (
                <div
                  key={order._id || order.orderId}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 16,
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(201, 168, 76, 0.12), rgba(236, 22, 140, 0.08))'
                      : 'var(--surface-primary, #14131E)',
                    border: isSelected
                      ? '1px solid var(--accent-gold, #C9A84C)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected
                      ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(201, 168, 76, 0.15)'
                      : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: 'var(--accent-gold, #C9A84C)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {order.orderId}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                        color: statusCfg.color,
                      }}
                    >
                      {statusCfg.badge || order.status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#FAF9FC' }}>
                      {order.customer?.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: '#FAF9FC',
                      }}
                    >
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      color: '#ACA6B8',
                    }}
                  >
                    <span>{order.items?.length || 0} items</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '12px 0',
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FAF9FC',
                  fontSize: '0.8rem',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.82rem', color: '#ACA6B8' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FAF9FC',
                  fontSize: '0.8rem',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active Order Details (7 cols on desktop) */}
        <div
          ref={selectedOrderRef}
          style={{
            gridColumn: 'span 7',
            background: 'var(--surface-primary, #14131E)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: 20,
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            height: 'fit-content',
            position: 'sticky',
            top: 24,
          }}
        >
          {!selectedOrder ? (
            <div
              style={{
                padding: '100px 20px',
                textAlign: 'center',
                color: '#ACA6B8',
              }}
            >
              <ShoppingBag size={42} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#FAF9FC' }}>
                Select an order to view full details
              </div>
            </div>
          ) : (
            <>
              {/* Order Header & Action Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: 20,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: '#FAF9FC',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {selectedOrder.orderId}
                    </h2>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.orderId, 'Order ID')}
                      title="Copy Order ID"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ACA6B8',
                        padding: '5px 8px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                      }}
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#ACA6B8', marginTop: 4 }}>
                    Placed on {formatDateTime(selectedOrder.createdAt)}
                  </div>
                </div>

                {/* Status Picker & Update */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '0.8rem', color: '#ACA6B8', fontWeight: 600 }}>
                    Status:
                  </label>
                  <select
                    value={selectedOrder.status}
                    disabled={statusUpdating}
                    onChange={(e) => handleUpdateStatus(selectedOrder.orderId, e.target.value)}
                    style={{
                      background: '#1A1828',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                      color: '#FAF9FC',
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="PENDING_WHATSAPP">Pending WhatsApp</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer Contact & Delivery Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 16,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  padding: '18px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold, #C9A84C)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 8,
                    }}
                  >
                    Customer Details
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#FAF9FC' }}>
                    {selectedOrder.customer?.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.84rem',
                      color: '#ACA6B8',
                      marginTop: 4,
                    }}
                  >
                    <Phone size={13} />
                    <span>+91 {selectedOrder.customer?.mobile}</span>
                  </div>

                  {/* Direct WhatsApp Contact CTA */}
                  <button
                    onClick={() => openWhatsAppChat(selectedOrder)}
                    style={{
                      marginTop: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                  >
                    <MessageCircle size={15} />
                    <span>Chat on WhatsApp</span>
                    <ExternalLink size={12} style={{ opacity: 0.8 }} />
                  </button>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold, #C9A84C)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 8,
                    }}
                  >
                    Delivery Destination
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      fontSize: '0.85rem',
                      color: '#FAF9FC',
                      lineHeight: 1.45,
                    }}
                  >
                    <MapPin size={15} color="#ACA6B8" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div>{selectedOrder.customer?.address}</div>
                      <div>
                        {selectedOrder.customer?.city} – {selectedOrder.customer?.pincode}
                      </div>
                    </div>
                  </div>

                  {selectedOrder.customer?.notes && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.04)',
                        fontSize: '0.76rem',
                        color: '#ACA6B8',
                      }}
                    >
                      <strong style={{ color: '#FAF9FC' }}>Note: </strong>
                      {selectedOrder.customer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold, #C9A84C)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Items in Order ({selectedOrder.items?.length || 0})
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#ACA6B8' }}>Price Breakdown</span>
                </div>

                <div
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        padding: '12px 16px',
                        borderBottom:
                          idx < selectedOrder.items.length - 1
                            ? '1px solid rgba(255, 255, 255, 0.06)'
                            : 'none',
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: '#1A1828',
                            flexShrink: 0,
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6E687A',
                              }}
                            >
                              <ShoppingBag size={18} />
                            </div>
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.88rem',
                              color: '#FAF9FC',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '0.76rem',
                              color: '#ACA6B8',
                              marginTop: 2,
                            }}
                          >
                            {item.size && (
                              <span
                                style={{
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(255, 255, 255, 0.06)',
                                }}
                              >
                                Size {item.size}
                              </span>
                            )}
                            {item.pieceCount && <span>{item.pieceCount} Pcs</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.96rem',
                            color: '#FAF9FC',
                          }}
                        >
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                        {item.quantity > 1 && (
                          <div style={{ fontSize: '0.72rem', color: '#ACA6B8' }}>
                            ₹{item.price} each
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 22px',
                  background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(236, 22, 140, 0.08))',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  borderRadius: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#ACA6B8', fontWeight: 600 }}>
                    Total Payable Amount
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-gold, #C9A84C)' }}>
                    All-India Free Shipping & Handcrafted Gift Box Included
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: '#FAF9FC',
                    letterSpacing: '-0.02em',
                  }}
                >
                  ₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
