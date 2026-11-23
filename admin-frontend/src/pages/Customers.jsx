import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ChevronRight,
  X,
  MessageCircle,
  Sparkles,
  Send,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import AdminDropdown from '../components/AdminDropdown';
import ConfirmModal from '../components/ConfirmModal';

const OFFER_TEMPLATES = [
  {
    title: 'Festive 20% Off',
    text: 'Festive Special: Enjoy an exclusive 20% OFF on our complete handcrafted designer glass bangle collection! Use code FESTIVE20 during checkout. Valid for this week only.',
  },
  {
    title: 'Free Luxury Gift Box',
    text: 'Privilege Treat: Get a complimentary premium velvet gift packaging box with your next handcrafted jewellery order over ₹999. Reply here to claim your offer.',
  },
  {
    title: 'New VIP Collection',
    text: 'VIP Early Access: Our brand new Bridal & Occasion Glass Bangle sets have arrived! Reply to this message to see exclusive designs before public release.',
  },
  {
    title: 'Free Express Shipping',
    text: 'Special Customer Benefit: Enjoy Free ST Courier Express Delivery on your next order, no minimum order value required! Reply with your favourite pieces.',
  },
];

const Customers = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    repeatCustomers: 0,
    repeatRate: 0,
    totalRevenue: 0,
    totalOrdersCount: 0,
    overallAOV: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'REPEAT' | 'HIGH_SPEND'
  const [sortBy, setSortBy] = useState('totalSpend'); // 'totalSpend' | 'totalOrders' | 'lastOrderDate'

  // Selected customer for order history drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Custom WhatsApp Offer Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [targetName, setTargetName] = useState('');
  const [offerMessageText, setOfferMessageText] = useState(OFFER_TEMPLATES[0].text);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [showOfferConfirm, setShowOfferConfirm] = useState(false);
  const [lastSentResult, setLastSentResult] = useState(null);

  const openOfferModal = (cust = null) => {
    if (cust) {
      setTargetPhone(cust.phone || '');
      setTargetName(cust.name || '');
    } else {
      setTargetPhone('');
      setTargetName('');
    }
    setLastSentResult(null);
    setOfferModalOpen(true);
  };

  const handleSendOffer = async () => {
    const cleanPhone = String(targetPhone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian phone number (starting with 6-9).');
      return;
    }
    if (!offerMessageText.trim() || offerMessageText.trim().length < 5) {
      toast.error('Offer message must be at least 5 characters long.');
      return;
    }

    setSendingOffer(true);
    try {
      const res = await api.post('/admin/customers/send-whatsapp-offer', {
        customerPhone: cleanPhone,
        customerName: targetName.trim(),
        offerMessage: offerMessageText.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Custom WhatsApp offer sent successfully!');
        setLastSentResult({
          phone: cleanPhone,
          name: targetName.trim(),
          waLink: res.data.waLink,
          simulated: res.data.simulated,
        });
        setShowOfferConfirm(false);
      }
    } catch (err) {
      console.error('Failed to send customer WhatsApp offer:', err);
      toast.error(err.response?.data?.message || 'Failed to dispatch offer message.');
      setShowOfferConfirm(false);
    } finally {
      setSendingOffer(false);
    }
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/customers', {
        params: {
          search,
          sortBy,
          sortOrder: 'desc',
        },
      });
      if (res.data?.success) {
        setStats(res.data.stats || {});
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customer analytics');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Load orders for a specific customer
  const handleOpenCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    setExpandedOrderId(null);
    try {
      const res = await api.get(`/admin/customers/${cust.phone}/orders`);
      if (res.data?.success) {
        setCustomerOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      toast.error('Failed to load customer orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filtered list based on tab
  const displayedCustomers = customers.filter((c) => {
    if (filterType === 'REPEAT') return c.totalOrders > 1;
    if (filterType === 'HIGH_SPEND') return c.totalSpend >= 2000;
    return true;
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Customer Management & Analytics"
        subtitle="Track customer order history, lifetime value (LTV), repeat rates, and engagement."
        icon={Users}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => openOfferModal(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-pink, #EC168C), var(--accent-purple, #9B3DFF))',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(236, 22, 140, 0.35)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <Sparkles size={16} />
            <span>Send WhatsApp Offer</span>
          </button>

          <button
            onClick={fetchCustomers}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </PageHeader>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Customers */}
        <div
          style={{
            background: 'var(--card-bg, #151420)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Customers
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {stats.totalCustomers}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#ACA6B8', marginTop: 4 }}>
            Unique buyer profiles
          </div>
        </div>

        {/* Repeat Customers */}
        <div
          style={{
            background: 'var(--card-bg, #151420)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Repeat Buyers
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {stats.repeatCustomers}
            <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 700, marginLeft: 8 }}>
              ({stats.repeatRate}%)
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#ACA6B8', marginTop: 4 }}>
            Placed 2 or more orders
          </div>
        </div>

        {/* Total Lifetime Value */}
        <div
          style={{
            background: 'var(--card-bg, #151420)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Revenue (LTV)
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            ₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#ACA6B8', marginTop: 4 }}>
            Across {stats.totalOrdersCount} total orders
          </div>
        </div>

        {/* Average Spend / AOV */}
        <div
          style={{
            background: 'var(--card-bg, #151420)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Average Order Value
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            ₹{stats.overallAOV?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#ACA6B8', marginTop: 4 }}>
            Per order average spend
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: 'var(--card-bg, #151420)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 20,
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ color: '#ACA6B8' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone (+91), or city..."
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FAF9FC',
              fontSize: '0.88rem',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterType === 'ALL' ? '#C4386C' : 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
            }}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('REPEAT')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterType === 'REPEAT' ? '#10B981' : 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
            }}
          >
            Repeat Buyers ({customers.filter((c) => c.totalOrders > 1).length})
          </button>
          <button
            onClick={() => setFilterType('HIGH_SPEND')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterType === 'HIGH_SPEND' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
            }}
          >
            High Value (≥ ₹2,000)
          </button>

          {/* Sort By Dropdown */}
          <AdminDropdown
            value={sortBy}
            onChange={setSortBy}
            title="Sort Customers"
            align="right"
            options={[
              { value: 'totalSpend', label: 'Highest Total Spend', icon: '💰' },
              { value: 'totalOrders', label: 'Most Orders Placed', icon: '📦' },
              { value: 'lastOrderDate', label: 'Most Recent Activity', icon: '🕒' },
            ]}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div
        style={{
          background: 'var(--card-bg, #151420)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 840 }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Spend (LTV)</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg. Order</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Active</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#ACA6B8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#ACA6B8' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
                    Loading customer analytics...
                  </td>
                </tr>
              ) : displayedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#ACA6B8' }}>
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                displayedCustomers.map((cust) => (
                  <tr
                    key={cust.phone}
                    onClick={() => handleOpenCustomer(cust)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Customer */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: cust.totalOrders > 1 ? 'linear-gradient(135deg, #EC168C, #8A2BE2)' : 'rgba(255, 255, 255, 0.08)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FAF9FC' }}>
                            {cust.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#ACA6B8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Phone size={12} />
                            +91 {cust.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Orders count */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: cust.totalOrders > 1 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.06)',
                          color: cust.totalOrders > 1 ? '#10B981' : '#FAF9FC',
                          border: cust.totalOrders > 1 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    {/* Total Spend */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{cust.totalSpend.toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* AOV */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ACA6B8', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{cust.averageOrderValue.toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* City */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: '0.84rem', color: '#FAF9FC', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} style={{ color: '#ACA6B8' }} />
                        {cust.city || '—'}
                      </div>
                    </td>

                    {/* Last Active */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ACA6B8' }}>
                        {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openOfferModal(cust);
                          }}
                          title="Send custom WhatsApp offer"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'rgba(37, 211, 102, 0.12)',
                            border: '1px solid rgba(37, 211, 102, 0.35)',
                            color: '#25D366',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Offer</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomer(cust);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background: 'rgba(196, 56, 108, 0.15)',
                            border: '1px solid rgba(196, 56, 108, 0.3)',
                            color: '#EC4899',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>History</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details & Order History Drawer / Modal */}
      {selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              height: '100%',
              background: '#151420',
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '-8px 0 36px rgba(0, 0, 0, 0.6)',
              overflowY: 'auto',
              padding: '24px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FAF9FC', margin: 0 }}>
                    {selectedCustomer.name}
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: '#ACA6B8', marginTop: 2 }}>
                    +91 {selectedCustomer.phone} {selectedCustomer.city ? `• ${selectedCustomer.city}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => openOfferModal(selectedCustomer)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(236, 22, 140, 0.2), rgba(138, 43, 226, 0.2))',
                    border: '1px solid rgba(236, 22, 140, 0.4)',
                    color: '#F472B6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={14} /> Send Offer
                </button>
                <a
                  href={`https://wa.me/91${selectedCustomer.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#25D366',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#FAF9FC',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Customer Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#ACA6B8', textTransform: 'uppercase', fontWeight: 600 }}>Total Spent</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
                  ₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#ACA6B8', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
                  {selectedCustomer.totalOrders}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#ACA6B8', textTransform: 'uppercase', fontWeight: 600 }}>Avg. Order</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
                  ₹{selectedCustomer.averageOrderValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Order History Timeline Heading */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FAF9FC', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Order History ({customerOrders.length})
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#ACA6B8' }}>Click order to see full details</span>
            </div>

            {/* Orders List */}
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: 36, color: '#ACA6B8' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                Loading orders...
              </div>
            ) : customerOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 36, color: '#ACA6B8', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 12 }}>
                No past orders found for this customer phone number.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {customerOrders.map((ord) => {
                  const isExpanded = expandedOrderId === ord._id;

                  return (
                    <div
                      key={ord._id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 14,
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      {/* Order Summary Row */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : ord._id)}
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
                              #{ord.orderId}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background:
                                  ord.status === 'DELIVERED'
                                    ? 'rgba(16, 185, 129, 0.16)'
                                    : ord.status === 'DISPATCHED'
                                    ? 'rgba(59, 130, 246, 0.16)'
                                    : 'rgba(245, 158, 11, 0.16)',
                                color:
                                  ord.status === 'DELIVERED'
                                    ? '#10B981'
                                    : ord.status === 'DISPATCHED'
                                    ? '#3B82F6'
                                    : '#F59E0B',
                              }}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#ACA6B8', marginTop: 4 }}>
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
                            ₹{ord.totalAmount}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#EC4899', fontWeight: 600, marginTop: 2 }}>
                            {ord.items?.length || 0} items {isExpanded ? '▲' : '▼'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Order Details */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: '14px 16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            background: 'rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          {/* Shipping info */}
                          <div style={{ marginBottom: 12, fontSize: '0.8rem', color: '#ACA6B8' }}>
                            <div style={{ fontWeight: 700, color: '#FAF9FC', marginBottom: 2 }}>Shipping Address:</div>
                            {ord.customerAddress || ord.shippingAddress?.streetAddress || '—'}, {ord.customerCity || ord.shippingAddress?.city || ''}
                          </div>

                          {/* Tracking ID if any */}
                          {ord.trackingId && (
                            <div style={{ marginBottom: 12, fontSize: '0.8rem', color: '#3B82F6', fontWeight: 600 }}>
                              AWB / Tracking: {ord.trackingId} ({ord.courierPartner || 'ST Courier'})
                            </div>
                          )}

                          {/* Items List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {ord.items?.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  borderRadius: 8,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                                    />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#FAF9FC' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: '#ACA6B8' }}>
                                      {item.selectedSize ? `Size: ${item.selectedSize} • ` : ''}
                                      {item.selectedColor?.name ? `Color: ${item.selectedColor.name} • ` : ''}
                                      Qty: {item.quantity || 1}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#FAF9FC' }}>
                                  ₹{item.price * (item.quantity || 1)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom WhatsApp Offer Modal */}
      {offerModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => !sendingOffer && setOfferModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              background: '#151420',
              border: '1px solid rgba(201, 168, 76, 0.35)',
              borderRadius: 20,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(236, 22, 140, 0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FAF9FC' }}>
                    Send Custom WhatsApp Offer
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#ACA6B8', marginTop: 2 }}>
                    Direct personalized WhatsApp broadcast to customer
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#ACA6B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Recipient Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold, #C9A84C)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  1. Target Customer
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select
                    className="admin-input"
                    value={targetPhone}
                    onChange={(e) => {
                      const sel = customers.find((c) => c.phone === e.target.value);
                      if (sel) {
                        setTargetPhone(sel.phone);
                        setTargetName(sel.name);
                      } else {
                        setTargetPhone(e.target.value);
                      }
                    }}
                    style={{ height: 40, fontSize: '0.84rem' }}
                  >
                    <option value="">-- Choose from registered/ordering customers --</option>
                    {customers.map((c) => (
                      <option key={c.phone} value={c.phone}>
                        {c.name} (+91 {c.phone}) • {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'} {c.city ? `(${c.city})` : ''}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#ACA6B8', marginBottom: 4 }}>Phone (10 digits)</div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.82rem', color: '#ACA6B8', fontWeight: 600 }}>
                          +91
                        </span>
                        <input
                          type="text"
                          maxLength={10}
                          value={targetPhone}
                          onChange={(e) => setTargetPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className="admin-input"
                          style={{ paddingLeft: 42, height: 38, fontSize: '0.84rem', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#ACA6B8', marginBottom: 4 }}>Customer Name</div>
                      <input
                        type="text"
                        value={targetName}
                        onChange={(e) => setTargetName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="admin-input"
                        style={{ height: 38, fontSize: '0.84rem', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Buttons */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold, #C9A84C)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    2. Quick Offer Templates
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#ACA6B8' }}>Click to apply</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {OFFER_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOfferMessageText(tmpl.text)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FAF9FC',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 22, 140, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(236, 22, 140, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <div style={{ color: '#F472B6', fontWeight: 700, marginBottom: 2 }}>{tmpl.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ACA6B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tmpl.text}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Message Textarea */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold, #C9A84C)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    3. Offer Message Text
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#ACA6B8' }}>
                    {offerMessageText.length} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={offerMessageText}
                  onChange={(e) => setOfferMessageText(e.target.value)}
                  placeholder="Type your exclusive customer offer or discount message..."
                  className="admin-input"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontSize: '0.84rem', lineHeight: '1.45', padding: '10px 12px' }}
                />
              </div>

              {/* WhatsApp Live Preview Bubble */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold, #C9A84C)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  4. WhatsApp Live Preview
                </label>
                <div
                  style={{
                    background: '#0B141A',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      background: '#005C4B',
                      color: '#E9EDEF',
                      borderRadius: '12px 12px 12px 2px',
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '92%',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#FFD700', marginBottom: 6 }}>
                      ✨ PrettyGlitz Special Offer ✨
                    </div>
                    {targetName ? <div>Dear <strong>{targetName}</strong>,<br /><br /></div> : null}
                    <div>{offerMessageText || 'Your customized offer text will appear here...'}</div>
                    <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#A0D8D0', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 6 }}>
                      For support, contact: +91 70107 37706
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Result Link if sent */}
              {lastSentResult && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(37, 211, 102, 0.15)',
                    border: '1px solid rgba(37, 211, 102, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#25D366', fontSize: '0.82rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>Offer sent successfully to +91 {lastSentResult.phone}!</span>
                  </div>
                  {lastSentResult.waLink && (
                    <a
                      href={lastSentResult.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#25D366',
                        color: '#FFFFFF',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Open in WhatsApp</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FAF9FC',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <button
                type="button"
                disabled={sendingOffer}
                onClick={() => {
                  const cleanPhone = String(targetPhone).replace(/\D/g, '').slice(-10);
                  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                    toast.error('Please enter a valid 10-digit Indian phone number.');
                    return;
                  }
                  if (!offerMessageText.trim() || offerMessageText.trim().length < 5) {
                    toast.error('Offer message must be at least 5 characters long.');
                    return;
                  }
                  setShowOfferConfirm(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: sendingOffer ? 'not-allowed' : 'pointer',
                  opacity: sendingOffer ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
                }}
              >
                <Send size={15} />
                <span>{sendingOffer ? 'Sending...' : 'Review & Send Offer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Dispatching Offer */}
      <ConfirmModal
        isOpen={showOfferConfirm}
        onClose={() => setShowOfferConfirm(false)}
        onConfirm={handleSendOffer}
        title="Confirm WhatsApp Offer Dispatch"
        message={`Are you sure you want to dispatch this custom WhatsApp offer to ${targetName ? targetName : 'the customer'} (+91 ${targetPhone})? This will send a real-time message with support contact info included.`}
        confirmText={sendingOffer ? 'Sending...' : 'Dispatch Offer'}
        type="info"
        loading={sendingOffer}
      />
    </div>
  );
};

export default Customers;
