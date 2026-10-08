import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Layers, Star, TrendingUp, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color, to }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div className="stat-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          {label}
        </p>
        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
          {value}
        </p>
      </div>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={22} color="white" />
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { admin } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, bangles: 0, flowers: 0, hair: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/products');
        setStats({
          total: data.length,
          active: data.filter(p => p.isActive).length,
          outOfStock: data.filter(p => !p.inStock).length,
        });
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{greeting} 👋</p>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          Welcome back, <span className="glitz-text">{admin?.username}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.95rem' }}>
          Here's what's happening in your store today.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 48 }}>
        <StatCard
          label="Total Products"
          value={stats.total}
          icon={TrendingUp}
          color="linear-gradient(135deg, var(--accent-pink), var(--accent-purple))"
          to="/products"
        />

        <StatCard
          label="Active Products"
          value={stats.active}
          icon={Star}
          color="linear-gradient(135deg, var(--accent-purple), #6366f1)"
          to="/products"
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStock}
          icon={Layers}
          color="linear-gradient(135deg, var(--accent-gold), #FBBF24)"
          to="/products"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 16, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
        Quick Actions
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {[
          { label: 'Add New Product', desc: 'List a new item in your store', to: '/products?action=new', color: 'rgba(236,22,140,0.05)', border: 'rgba(236,22,140,0.15)', textColor: 'var(--accent-pink)' },
          { label: 'Manage Categories', desc: 'Control homepage collection order', to: '/categories', color: 'rgba(214,168,95,0.05)', border: 'rgba(214,168,95,0.15)', textColor: 'var(--accent-gold)' },
        ].map(({ label, desc, to, color, border, textColor }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--surface-secondary)',
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: '20px 22px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${color}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: textColor, fontWeight: 600, fontSize: '0.95rem' }}>{label}</span>
                <ArrowUpRight size={16} style={{ color: textColor }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
