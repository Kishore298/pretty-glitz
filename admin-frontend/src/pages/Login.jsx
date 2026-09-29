import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, admin } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (admin) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(username, password);
    if (!res.success) setError(res.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0b0e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(138,43,226,0.2), transparent 70%)',
        top: '10%', left: '10%', pointerEvents: 'none',
        animation: 'pulse-orb 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(255,20,147,0.15), transparent 70%)',
        bottom: '15%', right: '10%', pointerEvents: 'none',
        animation: 'pulse-orb 8s ease-in-out infinite reverse',
      }} />

      <style>{`
        @keyframes pulse-orb {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 420,
        background: '#141419',
        border: '1px solid #1e1e28',
        borderRadius: 20,
        padding: '40px 40px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #FF1493, #8A2BE2, #FF8C00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(138,43,226,0.5)',
          }}>
            <Sparkles size={26} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: '1.6rem', color: '#f0f0f5', margin: 0,
          }}>
            PrettyGlitz
          </h1>
          <p style={{ color: '#4a4a60', fontSize: '0.85rem', marginTop: 6 }}>
            Sign in to your Admin Panel
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '10px 14px', color: '#f87171',
            fontSize: '0.85rem', marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', fontWeight: 500, marginBottom: 8 }}>
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="admin-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', fontWeight: 500, marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="admin-input"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a60',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '12px 22px', marginTop: 4, fontSize: '0.95rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
