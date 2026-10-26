import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  TrendingUp,
  ArrowUpRight,
  Plus,
  LayoutGrid,
  Sparkles,
  MessageSquareQuote,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { SkeletonStatCards } from '../components/SkeletonLoader';

const StatCard = ({ label, value, subtext, icon: Icon, color, to, badge }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div
      className="stat-card"
      style={{
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          <p
            className="stat-card-label"
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted, #6E687A)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}
          >
            {label}
          </p>
          <div
            className="stat-card-val"
            style={{
              fontSize: '2.3rem',
              fontWeight: 800,
              color: 'var(--text-primary, #FAF9FC)',
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
        </div>
        <div
          className="stat-card-icon"
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          <Icon size={22} color="white" />
        </div>
      </div>

      <div
        className="stat-card-footer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid var(--card-border)',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span className="stat-card-subtext" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {subtext}
        </span>
        {badge && (
          <span className={`badge-pill ${badge.className}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { admin } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    offers: 0,
    categories: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories').catch(() => ({ data: [] })),
        ]);
        const data = prodRes.data || [];
        setStats({
          total: data.length,
          active: data.filter((p) => p.isActive).length,
          outOfStock: data.filter((p) => !p.inStock).length,
          offers: data.filter((p) => p.isOffer).length,
          categories: (catRes.data || []).length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <PageWrapper>
      {/* Welcome Banner */}
      <div
        className="dashboard-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 36,
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(236, 22, 140, 0.08) 0%, rgba(155, 61, 255, 0.04) 50%, rgba(19, 18, 26, 0.8) 100%)',
          border: '1px solid rgba(236, 22, 140, 0.18)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {greeting}, {admin?.username || 'Administrator'}
            </span>
            <span
              style={{
                background: 'rgba(236, 22, 140, 0.12)',
                border: '1px solid rgba(236, 22, 140, 0.25)',
                color: 'var(--accent-pink)',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Manager
            </span>
          </div>

          <h1
            className="dashboard-banner-title"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Welcome to <span className="glitz-text">PrettyGlitz Control</span>
          </h1>

          <p className="dashboard-banner-subtitle" style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0, fontSize: '0.92rem' }}>
            Storefront status is healthy and accepting orders across India.
          </p>
        </div>

        <div className="dashboard-banner-date" style={{ textAlign: 'right' }}>
          <div className="date-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Date
          </div>
          <div className="date-val" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            {currentDate}
          </div>
        </div>
      </div>

      {/* Stat Cards Section */}
      {loading ? (
        <SkeletonStatCards />
      ) : (
        <div
          className="dashboard-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginBottom: 44,
          }}
        >
          <StatCard
            label="Total Products"
            value={stats.total}
            subtext={`${stats.categories} Collections listed`}
            icon={TrendingUp}
            color="linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
            to="/products"
            badge={{ text: 'Catalog', className: 'badge-info' }}
          />

          <StatCard
            label="Active Products"
            value={stats.active}
            subtext="Visible on customer site"
            icon={CheckCircle2}
            color="linear-gradient(135deg, #10B981, #059669)"
            to="/products"
            badge={{ text: 'Live Now', className: 'badge-success' }}
          />

          <StatCard
            label="Out of Stock"
            value={stats.outOfStock}
            subtext={stats.outOfStock > 0 ? 'Requires restocking' : 'All items in stock'}
            icon={AlertTriangle}
            color={stats.outOfStock > 0 ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #6E687A, #4B4656)'}
            to="/products"
            badge={{
              text: stats.outOfStock > 0 ? 'Attention' : 'Healthy',
              className: stats.outOfStock > 0 ? 'badge-danger' : 'badge-success',
            }}
          />

          <StatCard
            label="Special Offers"
            value={stats.offers}
            subtext="Discounted price tags"
            icon={Sparkles}
            color="linear-gradient(135deg, #E5B25D, #D97706)"
            to="/offers"
            badge={{ text: 'Deals', className: 'badge-warning' }}
          />
        </div>
      )}

      {/* Quick Actions Header */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="dashboard-section-title" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Quick Management Actions
          </h2>
          <p className="dashboard-section-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Frequently used operations to update your storefront.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div
        className="dashboard-actions-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 18,
          marginBottom: 44,
        }}
      >
        {[
          {
            label: 'Add New Product',
            desc: 'Upload photo, assign price and category',
            to: '/products?action=new',
            icon: Plus,
            color: 'var(--accent-pink)',
            bg: 'rgba(236, 22, 140, 0.08)',
            border: 'rgba(236, 22, 140, 0.2)',
          },
          {
            label: 'Manage Categories',
            desc: 'Organize collection sequence on homepage',
            to: '/categories',
            icon: LayoutGrid,
            color: 'var(--accent-purple)',
            bg: 'rgba(155, 61, 255, 0.08)',
            border: 'rgba(155, 61, 255, 0.2)',
          },
          {
            label: 'Create Special Offer',
            desc: 'Discount prices for festive seasons',
            to: '/offers',
            icon: Sparkles,
            color: '#E5B25D',
            bg: 'rgba(229, 178, 93, 0.08)',
            border: 'rgba(229, 178, 93, 0.2)',
          },
          {
            label: 'Moderate Reviews',
            desc: 'Approve authentic customer testimonials',
            to: '/testimonials',
            icon: MessageSquareQuote,
            color: '#34D399',
            bg: 'rgba(16, 185, 129, 0.08)',
            border: 'rgba(16, 185, 129, 0.2)',
          },
        ].map(({ label, desc, to, icon: Icon, color, bg, border }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div
              className="action-card"
              style={{
                background: 'var(--surface-primary)',
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: '22px 24px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.3), 0 0 20px ${bg}`;
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = border;
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight size={18} style={{ color }} />
                </div>
                <div className="action-card-title" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
                  {label}
                </div>
                <p className="action-card-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, lineHeight: 1.45 }}>
                  {desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Storefront Overview Card */}
      <div
        className="dashboard-preview-card"
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 18,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: '1 1 280px' }}>
          <div
            className="preview-icon-wrap"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(236, 22, 140, 0.1)',
              border: '1px solid rgba(236, 22, 140, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-pink)',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="dashboard-preview-card-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Looking for client preview?
            </div>
            <div className="dashboard-preview-card-desc" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Inspect newly saved products, categories and glittering footer directly on the storefront.
            </div>
          </div>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary dashboard-preview-btn"
          style={{ textDecoration: 'none' }}
        >
          <span>Open Storefront</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
