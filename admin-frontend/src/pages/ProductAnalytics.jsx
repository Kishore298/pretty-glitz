import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Search,
  Heart,
  ShoppingCart,
  Flame,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import api from '../utils/api';
import { optimizeImageUrl } from '../utils/cloudinary';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const ProductAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalProducts: 0,
      totalActiveWishlistCount: 0,
      totalActiveCartUsers: 0,
      totalActiveCartUnits: 0,
      topWishlistedProduct: null,
      topCartedProduct: null,
    },
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [stockStatus, setStockStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'HIGH_DEMAND' | 'OPPORTUNITY'
  const [sortBy, setSortBy] = useState('demandScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | '30D' | '7D' | 'TODAY'
  const [categoriesList, setCategoriesList] = useState([]);

  // Fetch unique categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        if (Array.isArray(data)) {
          setCategoriesList(data.map((c) => c.name || c.title || c));
        }
      } catch {
        // Fallback or ignore
      }
    };
    fetchCategories();
  }, []);

  // Fetch analytics with current filters
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        category: category !== 'ALL' ? category : undefined,
        stockStatus: stockStatus !== 'ALL' ? stockStatus : undefined,
        filterType: filterType !== 'ALL' ? filterType : undefined,
        sortBy,
        sortOrder,
      };

      // Handle date presets
      if (datePreset === 'TODAY') {
        const today = new Date().toISOString().slice(0, 10);
        params.startDate = today;
        params.endDate = today;
      } else if (datePreset === '7D') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString().slice(0, 10);
      } else if (datePreset === '30D') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.startDate = d.toISOString().slice(0, 10);
      }

      const { data } = await api.get('/analytics/products', { params });
      setAnalyticsData(data || { summary: {}, products: [] });
    } catch (err) {
      console.error('[ProductAnalytics] error:', err);
      toast.error('Failed to load product analytics.');
    } finally {
      setLoading(false);
    }
  }, [search, category, stockStatus, filterType, sortBy, sortOrder, datePreset]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export to Excel handler
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/analytics/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PrettyGlitz_Product_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Analytics report downloaded successfully!');
    } catch (err) {
      console.error('[Export] error:', err);
      toast.error('Failed to export analytics report.');
    } finally {
      setExporting(false);
    }
  };

  const { summary, products } = analyticsData;

  return (
    <PageWrapper>
      {/* Header with Export CTA */}
      <PageHeader
        title="Product Demand Analytics"
        subtitle="Real-time active wishlist & cart demand versus lifetime customer engagement"
        action={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="admin-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: 'none',
              cursor: exporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <Download size={16} />
            {exporting ? 'Generating Excel...' : 'Export to Excel'}
          </button>
        }
      />

      {/* KPI Overview Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 18,
          marginBottom: 28,
        }}
      >
        {/* Total Active Wishlists */}
        <div
          style={{
            background: 'var(--card-bg, #14131D)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
            borderRadius: 18,
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ACA6B8', fontWeight: 600 }}>
              Active Wishlists
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(225, 29, 72, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48' }}>
              <Heart size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {summary?.totalActiveWishlistCount ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#8E879B', marginTop: 4 }}>
            Saved by customers right now
          </div>
        </div>

        {/* Total Active Carts */}
        <div
          style={{
            background: 'var(--card-bg, #14131D)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
            borderRadius: 18,
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ACA6B8', fontWeight: 600 }}>
              Active User Carts
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196, 56, 108, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4386C' }}>
              <ShoppingCart size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {summary?.totalActiveCartUsers ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#8E879B', marginTop: 4 }}>
            Across {summary?.totalActiveCartUnits ?? 0} live item units
          </div>
        </div>

        {/* Top Wishlisted Product Highlight */}
        <div
          style={{
            background: 'var(--card-bg, #14131D)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
            borderRadius: 18,
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ACA6B8', fontWeight: 600 }}>
              Top Wishlisted
            </span>
            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48', fontWeight: 700 }}>
              {summary?.topWishlistedProduct ? `${summary.topWishlistedProduct.count} Saves` : 'None'}
            </span>
          </div>
          {summary?.topWishlistedProduct ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {summary.topWishlistedProduct.image && (
                <img
                  src={optimizeImageUrl(summary.topWishlistedProduct.image, 80)}
                  alt={summary.topWishlistedProduct.name}
                  style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FAF9FC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {summary.topWishlistedProduct.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#C9A84C' }}>Highest organic desire</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#8E879B' }}>No active wishlists yet</div>
          )}
        </div>

        {/* Top Carted Product Highlight */}
        <div
          style={{
            background: 'var(--card-bg, #14131D)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
            borderRadius: 18,
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ACA6B8', fontWeight: 600 }}>
              Top In-Cart
            </span>
            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 700 }}>
              {summary?.topCartedProduct ? `${summary.topCartedProduct.count} Carts` : 'None'}
            </span>
          </div>
          {summary?.topCartedProduct ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {summary.topCartedProduct.image && (
                <img
                  src={optimizeImageUrl(summary.topCartedProduct.image, 80)}
                  alt={summary.topCartedProduct.name}
                  style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FAF9FC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {summary.topCartedProduct.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#10B981' }}>Highest purchase intent</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#8E879B' }}>No active carts yet</div>
          )}
        </div>
      </div>

      {/* Control Filters Bar */}
      <div
        style={{
          background: 'var(--card-bg, #14131D)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8E879B' }} />
          <input
            type="text"
            placeholder="Search product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FAF9FC',
              fontSize: '0.86rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: 10,
            background: '#1A1826',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#FAF9FC',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Categories</option>
          {categoriesList.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Stock Status Filter */}
        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: 10,
            background: '#1A1826',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#FAF9FC',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Stock Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>

        {/* Demand Segment Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterType === 'ALL' ? 'var(--accent, #C4386C)' : 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('HIGH_DEMAND')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterType === 'HIGH_DEMAND' ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
              color: filterType === 'HIGH_DEMAND' ? '#FFFFFF' : '#F87171',
            }}
          >
            <Flame size={14} /> High Demand
          </button>
          <button
            type="button"
            onClick={() => setFilterType('OPPORTUNITY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterType === 'OPPORTUNITY' ? '#D97706' : 'rgba(217, 119, 6, 0.1)',
              color: filterType === 'OPPORTUNITY' ? '#FFFFFF' : '#FBBF24',
            }}
            title="Products with high wishlist saves but zero or low cart additions"
          >
            <Lightbulb size={14} /> Opportunity
          </button>
        </div>

        {/* Date Range Preset Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={15} style={{ color: '#8E879B' }} />
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              background: '#1A1826',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FAF9FC',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
          </select>
        </div>

        {/* Sort selector & Order Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              background: '#1A1826',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FAF9FC',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="demandScore">Sort by: Demand Score</option>
            <option value="activeWishlist">Sort by: Active Wishlist</option>
            <option value="activeCart">Sort by: Active Carts</option>
            <option value="lifetimeWishlist">Sort by: Lifetime Wishlist</option>
            <option value="lifetimeCart">Sort by: Lifetime Carts</option>
            <option value="price">Sort by: Price</option>
            <option value="name">Sort by: Name</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FAF9FC',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {sortOrder === 'desc' ? 'Desc ↓' : 'Asc ↑'}
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchAnalytics}
          title="Refresh metrics"
          style={{
            padding: '9px 12px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#FAF9FC',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
        </button>
      </div>

      {/* Analytics Data Table */}
      <div
        style={{
          background: 'var(--card-bg, #14131D)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 920 }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(201, 168, 76, 0.12)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#ACA6B8',
                }}
              >
                <th style={{ padding: '16px 20px', width: '30%' }}>Product</th>
                <th style={{ padding: '16px 14px' }}>Category & Price</th>
                <th style={{ padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#E11D48' }}>
                    <Heart size={14} /> Active Wishlist
                  </div>
                </th>
                <th style={{ padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
                    <ShoppingCart size={14} /> Active Carts
                  </div>
                </th>
                <th style={{ padding: '16px 14px', textAlign: 'center' }}>
                  <span style={{ color: '#C9A84C' }}>Lifetime Intent</span>
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Demand Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '64px', textAlign: 'center', color: '#ACA6B8' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }} />
                    <div>Loading product demand analytics...</div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '64px', textAlign: 'center' }}>
                    <EmptyState
                      icon={BarChart3}
                      title="No matching products found"
                      description="Adjust your search query or filters to inspect other products."
                    />
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Product Cell */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.04)',
                            flexShrink: 0,
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {item.image ? (
                            <img
                              src={optimizeImageUrl(item.image, 120)}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E879B' }}>
                              PG
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FAF9FC', marginBottom: 3 }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem' }}>
                            {item.inStock ? (
                              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={12} /> In Stock
                              </span>
                            ) : (
                              <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <XCircle size={12} /> Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Price */}
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ACA6B8', marginBottom: 2 }}>{item.category}</div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FAF9FC' }}>₹{item.price}</div>
                    </td>

                    {/* Active Wishlist Count */}
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 999,
                          background: item.activeWishlistCount > 0 ? 'rgba(225, 29, 72, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          color: item.activeWishlistCount > 0 ? '#E11D48' : '#8E879B',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                        }}
                      >
                        <Heart size={13} style={{ fill: item.activeWishlistCount > 0 ? '#E11D48' : 'none' }} />
                        <span>{item.activeWishlistCount}</span>
                      </div>
                    </td>

                    {/* Active Carts Count */}
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 999,
                          background: item.activeCartUsers > 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                          color: item.activeCartUsers > 0 ? '#10B981' : '#8E879B',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                        }}
                      >
                        <ShoppingCart size={13} />
                        <span>{item.activeCartUsers} users</span>
                        {item.activeCartUnits > 0 && (
                          <span style={{ fontSize: '0.74rem', opacity: 0.8 }}>({item.activeCartUnits} pcs)</span>
                        )}
                      </div>
                    </td>

                    {/* Lifetime Intent */}
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.82rem', color: '#FAF9FC' }}>
                        <span style={{ color: '#E11D48', fontWeight: 600 }}>{item.lifetimeWishlistAdds}</span> wish /{' '}
                        <span style={{ color: '#10B981', fontWeight: 600 }}>{item.lifetimeCartAdds}</span> cart
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8E879B', marginTop: 2 }}>
                        {item.lifetimeCartQty} total units added
                      </div>
                    </td>

                    {/* Status Badges */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {item.isHighDemand && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 999,
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <Flame size={12} /> High Demand
                          </span>
                        )}

                        {item.isOpportunity && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 999,
                              background: 'rgba(217, 119, 6, 0.15)',
                              color: '#FBBF24',
                              border: '1px solid rgba(217, 119, 6, 0.3)',
                            }}
                            title="High wishlist interest with low cart conversion. Consider pricing or promotion."
                          >
                            <Lightbulb size={12} /> Opportunity
                          </span>
                        )}

                        {!item.isHighDemand && !item.isOpportunity && (
                          <span style={{ fontSize: '0.76rem', color: '#8E879B' }}>
                            Score: {item.demandScore}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProductAnalytics;
