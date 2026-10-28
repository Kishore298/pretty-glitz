import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Gem,
  ArrowUpRight,
  Plus,
  Layers,
  Flower2,
  Tag,
  MessageSquareQuote,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  TrendingUp
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
        padding: '24px 26px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        background: 'var(--surface-primary, #14131E)',
        border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
        borderRadius: 18,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(201, 168, 76, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--card-border, rgba(201, 168, 76, 0.12))';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
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
              fontSize: '2.4rem',
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
            width: 48,
            height: 48,
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
          paddingTop: 14,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span className="stat-card-subtext" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
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
    subcategories: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, catRes, subcatRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/subcategories').catch(() => ({ data: [] })),
        ]);
        const data = prodRes.data || [];
        setStats({
          total: data.length,
          active: data.filter((p) => p.isActive).length,
          outOfStock: data.filter((p) => !p.inStock).length,
          offers: data.filter((p) => p.isOffer).length,
          categories: (catRes.data || []).length,
          subcategories: (subcatRes.data || []).length,
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
      {/* Editorial Luxury Welcome Banner */}
      <div
        className="dashboard-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 36,
          padding: '30px 36px',
          background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.12) 0%, rgba(138, 43, 226, 0.08) 50%, rgba(20, 19, 30, 0.85) 100%)',
          border: '1px solid rgba(201, 168, 76, 0.22)',
          borderRadius: 22,
          boxShadow: '0 10px 36px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Subtle Accent Light */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(201, 168, 76, 0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ minWidth: 0, flex: '1 1 320px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {greeting}, {admin?.username || 'Administrator'}
            </span>
            <span
              style={{
                background: 'rgba(201, 168, 76, 0.14)',
                border: '1px solid rgba(201, 168, 76, 0.35)',
                color: 'var(--accent-gold-light, #E8CE8A)',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={11} /> Atelier Controller
            </span>
          </div>

          <h1
            className="dashboard-banner-title"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
            }}
          >
            Welcome to <span className="glitz-text" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>PrettyGlitz</span> Control
          </h1>

          <p className="dashboard-banner-subtitle" style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0, fontSize: '0.92rem', maxWidth: 640 }}>
            Catalog operations, collection reordering, and customer storefront management are synchronized in real-time.
          </p>
        </div>

        <div className="dashboard-banner-date" style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
          <div className="date-label" style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Live Calendar
          </div>
          <div className="date-val" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            {currentDate}
          </div>
        </div>
      </div>

      {/* Stat Cards Section */}
      {loading ? (
        <SkeletonStatCards count={4} />
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
            icon={Gem}
            color="linear-gradient(135deg, #C4386C, #8A2BE2)"
            to="/products"
            badge={{ text: 'Inventory', className: 'badge-info' }}
          />

          <StatCard
            label="Active Products"
            value={stats.active}
            subtext="Live on customer storefront"
            icon={CheckCircle2}
            color="linear-gradient(135deg, #10B981, #059669)"
            to="/products"
            badge={{ text: 'Active', className: 'badge-success' }}
          />

          <StatCard
            label="Out of Stock"
            value={stats.outOfStock}
            subtext={stats.outOfStock > 0 ? 'Requires restocking' : 'All items in stock'}
            icon={AlertCircle}
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
            subtext="Discounted price campaigns"
            icon={Tag}
            color="linear-gradient(135deg, #C9A84C, #9E7D2D)"
            to="/offers"
            badge={{ text: 'Promotions', className: 'badge-warning' }}
          />
        </div>
      )}

      {/* Quick Actions Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="dashboard-section-title" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Quick Management Operations
          </h2>
          <p className="dashboard-section-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0' }}>
            Frequently used tools to keep your jewellery collections updated.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div
        className="dashboard-actions-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          marginBottom: 44,
        }}
      >
        {[
          {
            label: 'Add New Product',
            desc: 'Upload multi-angle photos, set price, sizes, and stock',
            to: '/products?action=new',
            icon: Plus,
            color: 'var(--accent-pink)',
            bg: 'rgba(196, 56, 108, 0.1)',
            border: 'rgba(196, 56, 108, 0.22)',
          },
          {
            label: 'Organize Categories',
            desc: `Arrange ${stats.categories} main collection displays`,
            to: '/categories',
            icon: Layers,
            color: 'var(--accent-purple)',
            bg: 'rgba(138, 43, 226, 0.1)',
            border: 'rgba(138, 43, 226, 0.22)',
          },
          {
            label: 'Flower Subcategories',
            desc: `Organize artificial flower varieties and garlands`,
            to: '/subcategories',
            icon: Flower2,
            color: '#EC4899',
            bg: 'rgba(236, 72, 153, 0.1)',
            border: 'rgba(236, 72, 153, 0.22)',
          },
          {
            label: 'Special Offer Pricing',
            desc: 'Create festive discounts and sale ribbon tags',
            to: '/offers',
            icon: Tag,
            color: 'var(--accent-gold)',
            bg: 'rgba(201, 168, 76, 0.1)',
            border: 'rgba(201, 168, 76, 0.25)',
          },
          {
            label: 'Moderate Testimonials',
            desc: 'Approve authentic verified customer reviews',
            to: '/testimonials',
            icon: MessageSquareQuote,
            color: '#34D399',
            bg: 'rgba(16, 185, 129, 0.1)',
            border: 'rgba(16, 185, 129, 0.22)',
          },
        ].map(({ label, desc, to, icon: Icon, color, bg, border }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div
              className="action-card"
              style={{
                background: 'var(--surface-primary, #14131E)',
                border: `1px solid ${border}`,
                borderRadius: 18,
                padding: '24px',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 14px 32px rgba(0, 0, 0, 0.35), 0 0 24px ${bg}`;
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = border;
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
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
                <div className="action-card-title" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.02rem', marginBottom: 6 }}>
                  {label}
                </div>
                <p className="action-card-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
                  {desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Storefront Overview Preview Banner */}
      <div
        className="dashboard-preview-card"
        style={{
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          borderRadius: 20,
          padding: '26px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0, flex: '1 1 300px' }}>
          <div
            className="preview-icon-wrap"
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(201, 168, 76, 0.1)',
              border: '1px solid rgba(201, 168, 76, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="dashboard-preview-card-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Looking for client storefront preview?
            </div>
            <div className="dashboard-preview-card-desc" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 3 }}>
              Inspect newly saved products, category order, and festive discount ribbons directly on the customer storefront.
            </div>
          </div>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px',
            fontSize: '0.88rem',
            fontWeight: 700,
            borderRadius: 12,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(196, 56, 108, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 56, 108, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(196, 56, 108, 0.35)';
          }}
        >
          <span>Open Live Storefront</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
