import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Eye,
  Clock,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Search,
  Sparkles,
  ArrowUpDown,
  Compass,
  Trash2,
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

const formatDuration = (totalSeconds) => {
  const s = Math.round(Number(totalSeconds) || 0);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins < 60) {
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

const TrafficAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d'); // 'today' | '7d' | '30d'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('uniqueVisitors'); // 'uniqueVisitors' | 'totalViews' | 'avgDurationSeconds'
  const [data, setData] = useState({
    summary: {
      totalUniqueVisitors: 0,
      totalViews: 0,
      totalDurationSeconds: 0,
      avgDurationPerVisitor: 0,
      platformBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    },
    dailyTrend: [],
    pages: [],
  });

  const fetchTrafficData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/traffic', {
        params: { range },
      });
      if (res.data) {
        setData({
          summary: res.data.summary || {
            totalUniqueVisitors: 0,
            totalViews: 0,
            totalDurationSeconds: 0,
            avgDurationPerVisitor: 0,
            platformBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
          },
          dailyTrend: res.data.dailyTrend || [],
          pages: res.data.pages || [],
        });
      }
    } catch (err) {
      console.error('Error fetching traffic analytics:', err);
      toast.error('Failed to load traffic analytics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchTrafficData();
  }, [fetchTrafficData]);

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all storefront traffic analytics data? This will clear test visits and start counts fresh.')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete('/analytics/traffic/reset');
      toast.success('Traffic analytics reset successfully');
      fetchTrafficData();
    } catch (err) {
      console.error('Error resetting traffic analytics:', err);
      toast.error('Failed to reset traffic data');
      setLoading(false);
    }
  };

  // Filter & Sort Pages
  const filteredPages = data.pages
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.path && p.path.toLowerCase().includes(q)) ||
        (p.pageTitle && p.pageTitle.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'uniqueVisitors') {
        return (b.uniqueVisitors || 0) - (a.uniqueVisitors || 0);
      }
      if (sortBy === 'totalViews') {
        return (b.totalViews || 0) - (a.totalViews || 0);
      }
      if (sortBy === 'avgDurationSeconds') {
        return (b.avgDurationSeconds || 0) - (a.avgDurationSeconds || 0);
      }
      return 0;
    });

  const totalPlatforms =
    (data.summary.platformBreakdown.mobile || 0) +
    (data.summary.platformBreakdown.desktop || 0) +
    (data.summary.platformBreakdown.tablet || 0);

  const mobilePct =
    totalPlatforms > 0
      ? Math.round(((data.summary.platformBreakdown.mobile || 0) / totalPlatforms) * 100)
      : 0;
  const desktopPct =
    totalPlatforms > 0
      ? Math.round(((data.summary.platformBreakdown.desktop || 0) / totalPlatforms) * 100)
      : 0;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Page Header */}
      <PageHeader
        title="Storefront Traffic & Page Engagement"
        subtitle="Device-deduplicated visitor counts and per-page time spent analytics"
      />

      {/* Top Filter & Refresh Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 6, background: '#12111A', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { label: 'Today', value: 'today' },
            { label: 'Last 7 Days', value: '7d' },
            { label: 'Last 30 Days', value: '30d' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRange(tab.value)}
              style={{
                padding: '7px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: range === tab.value ? 'linear-gradient(135deg, #C4386C, #8A2BE2)' : 'transparent',
                color: range === tab.value ? '#FFFFFF' : '#8E8A99',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchTrafficData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#DDD7E5',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={handleResetData}
            disabled={loading}
            title="Purge all page visit and duration records to start fresh"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <Trash2 size={13} />
            Reset Data
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {/* Unique Device Visitors */}
        <div
          style={{
            background: '#12111A',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: 16,
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9D97A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Unique Devices
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201, 168, 76, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8B923' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {data.summary.totalUniqueVisitors.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7E7A8A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} color="#E8B923" /> Deduplicated physical devices
          </div>
        </div>

        {/* Total Page Views */}
        <div
          style={{
            background: '#12111A',
            border: '1px solid rgba(196, 56, 108, 0.2)',
            borderRadius: 16,
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9D97A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Page Hits
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196, 56, 108, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC168C' }}>
              <Eye size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {data.summary.totalViews.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7E7A8A', marginTop: 4 }}>
            Aggregated storefront views
          </div>
        </div>

        {/* Avg Time Per Visitor */}
        <div
          style={{
            background: '#12111A',
            border: '1px solid rgba(138, 43, 226, 0.2)',
            borderRadius: 16,
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9D97A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Avg Time / Device
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(138, 43, 226, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FAF9FC', fontFamily: 'Outfit, sans-serif' }}>
            {formatDuration(data.summary.avgDurationPerVisitor)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7E7A8A', marginTop: 4 }}>
            Total active browsing time
          </div>
        </div>

        {/* Device Split (Mobile vs Desktop) */}
        <div
          style={{
            background: '#12111A',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 16,
            padding: '20px 22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9D97A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Platform Split
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <Smartphone size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            {totalPlatforms > 0 ? (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FAF9FC' }}>
                  {mobilePct}% <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8E8A99' }}>Mobile</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#A09CAE' }}>
                  {desktopPct}% <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8E8A99' }}>Desktop</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#8E8A99' }}>
                No visits recorded yet
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 10, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${totalPlatforms > 0 ? mobilePct : 0}%`, background: '#EC168C' }} />
            <div style={{ width: `${totalPlatforms > 0 ? desktopPct : 0}%`, background: '#3B82F6' }} />
          </div>
        </div>
      </div>

      {/* Pages Ranking Section */}
      <div
        style={{
          background: '#12111A',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
        }}
      >
        {/* Table Controls */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FAF9FC' }}>
              Per-Page Visitor & Duration Analytics
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#8E8A99' }}>
              Identifies which pages attract the most unique customers and hold user attention longest
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search filter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#1A1826',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '6px 12px',
                width: 230,
              }}
            >
              <Search size={14} color="#8E8A99" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search page URL or title..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FAF9FC',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            {/* Sort selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#1A1826',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '4px 10px',
              }}
            >
              <ArrowUpDown size={14} color="#8E8A99" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#DDD7E5',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="uniqueVisitors" style={{ background: '#1A1826' }}>Sort by: Unique Devices</option>
                <option value="totalViews" style={{ background: '#1A1826' }}>Sort by: Total Views</option>
                <option value="avgDurationSeconds" style={{ background: '#1A1826' }}>Sort by: Avg Time Spent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#8E8A99', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rank
                </th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#8E8A99', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Storefront Page
                </th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#8E8A99', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  Unique Devices
                </th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#8E8A99', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  Total Hits
                </th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#8E8A99', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  Avg Time Spent
                </th>
                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#8E8A99', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#8E8A99' }}>
                    <Compass size={36} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>No page traffic records found for this period.</div>
                    <div style={{ fontSize: '0.8rem', color: '#6A6575', marginTop: 4 }}>
                      As customers browse the storefront, deduplicated visits and engagement times will appear here in real time.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page, index) => {
                  const storefrontUrl = `http://localhost:3000${page.path}`;
                  return (
                    <tr
                      key={page.path || index}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Rank */}
                      <td style={{ padding: '14px 18px', fontSize: '0.88rem', fontWeight: 700, color: index < 3 ? '#E8B923' : '#6A6575' }}>
                        #{index + 1}
                      </td>

                      {/* Page Info */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FAF9FC', wordBreak: 'break-all' }}>
                          {page.pageTitle || page.path}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#8E8A99', fontFamily: 'monospace', marginTop: 2 }}>
                          {page.path}
                        </div>
                      </td>

                      {/* Unique Visitors (Badge) */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'rgba(201, 168, 76, 0.12)',
                            color: '#E8B923',
                            border: '1px solid rgba(201, 168, 76, 0.25)',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '0.84rem',
                          }}
                        >
                          {page.uniqueVisitors.toLocaleString()} devices
                        </span>
                      </td>

                      {/* Total Views */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', fontSize: '0.88rem', color: '#DDD7E5', fontWeight: 600 }}>
                        {page.totalViews.toLocaleString()}
                      </td>

                      {/* Avg Time Spent */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            color: page.avgDurationSeconds > 45 ? '#10B981' : '#DDD7E5',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          <Clock size={13} />
                          {formatDuration(page.avgDurationSeconds)}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <a
                          href={storefrontUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open page in customer storefront"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.78rem',
                            color: '#C4386C',
                            textDecoration: 'none',
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(196, 56, 108, 0.1)',
                          }}
                        >
                          View <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrafficAnalytics;
