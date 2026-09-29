import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Layers, Star, TrendingUp, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color, to }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div className="stat-card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '0.8rem', color: '#8a8aa0', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
          {label}
        </p>
        <p style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f0f0f5', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0b0e' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: '0.85rem', color: '#8a8aa0', marginBottom: 6 }}>{greeting} 👋</p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
            Welcome back, <span className="glitz-text">{admin?.username}</span>
          </h1>
          <p style={{ color: '#4a4a60', marginTop: 8, fontSize: '0.9rem' }}>
            Here's what's happening in your store today.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 48 }}>
          <StatCard
            label="Total Products"
            value={stats.total}
            icon={TrendingUp}
            color="linear-gradient(135deg, #FF1493, #8A2BE2)"
            to="/products"
          />

          <StatCard
            label="Active Products"
            value={stats.active}
            icon={Star}
            color="linear-gradient(135deg, #8A2BE2, #6366f1)"
            to="/products"
          />
          <StatCard
            label="Out of Stock"
            value={stats.outOfStock}
            icon={Layers}
            color="linear-gradient(135deg, #FF8C00, #FFD700)"
            to="/products"
          />
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 16, fontSize: '0.8rem', color: '#4a4a60', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { label: 'Add New Product', desc: 'List a new item in your store', to: '/products?action=new', color: 'rgba(255,20,147,0.1)', border: 'rgba(255,20,147,0.2)', textColor: '#fb7185' },
            { label: 'Manage Categories', desc: 'Control homepage collection order', to: '/categories', color: 'rgba(255,140,0,0.1)', border: 'rgba(255,140,0,0.2)', textColor: '#fb923c' },
          ].map(({ label, desc, to, color, border, textColor }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: color,
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
                <p style={{ color: '#4a4a60', fontSize: '0.8rem', margin: 0 }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
