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
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

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

          {/* Sort By Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
              color: '#FAF9FC',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="totalSpend">Sort by Highest Spend</option>
            <option value="totalOrders">Sort by Order Count</option>
            <option value="lastOrderDate">Sort by Most Recent</option>
          </select>
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
    </div>
  );
};

export default Customers;
