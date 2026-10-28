import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login, admin } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (admin) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(username, password);
    if (!res.success) setError(res.message);
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#08070D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 24,
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          background: 'radial-gradient(circle, rgba(236, 22, 140, 0.16) 0%, transparent 70%)',
          top: '-10%',
          left: '5%',
          pointerEvents: 'none',
          filter: 'blur(50px)',
          animation: 'pulse 8s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 460,
          height: 460,
          background: 'radial-gradient(circle, rgba(155, 61, 255, 0.14) 0%, transparent 70%)',
          bottom: '-10%',
          right: '5%',
          pointerEvents: 'none',
          filter: 'blur(50px)',
          animation: 'pulse 10s ease-in-out infinite alternate-reverse',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 380,
          height: 380,
          background: 'radial-gradient(circle, rgba(229, 178, 93, 0.08) 0%, transparent 70%)',
          top: '40%',
          right: '30%',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(18, 16, 26, 0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          padding: '44px 38px 36px',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(236, 22, 140, 0.15)',
        }}
      >
        {/* Glowing Top Accent Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent-pink, #EC168C), var(--accent-purple, #9B3DFF), transparent)',
          }}
        />

        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-pink, #EC168C), var(--accent-purple, #9B3DFF))',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 12px 40px rgba(236, 22, 140, 0.45)',
              overflow: 'hidden',
            }}
          >
            <img
              src="/pretty-glitz-logo.png"
              alt="PrettyGlitz Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scale(1.36)',
                transformOrigin: 'center 30%',
                borderRadius: '50%',
              }}
            />
          </div>

          <h1
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.75rem',
              color: '#FAF9FC',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            PrettyGlitz <span className="glitz-text">Console</span>
          </h1>

          <p
            style={{
              color: 'var(--text-secondary, #ACA6B8)',
              fontSize: '0.88rem',
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Sign in to access your jewelry & floral catalog management.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#F87171',
              fontSize: '0.85rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Username Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'var(--text-secondary, #ACA6B8)',
                fontWeight: 600,
                marginBottom: 8,
                letterSpacing: '0.02em',
              }}
            >
              Administrator Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="admin-input"
                style={{
                  paddingLeft: 42,
                  height: 46,
                }}
              />
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #6E687A)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'var(--text-secondary, #ACA6B8)',
                fontWeight: 600,
                marginBottom: 8,
                letterSpacing: '0.02em',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="admin-input"
                style={{
                  paddingLeft: 42,
                  paddingRight: 44,
                  height: 46,
                }}
              />
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #6E687A)',
                  pointerEvents: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #6E687A)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #6E687A)')}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              height: 48,
              fontSize: '0.96rem',
              marginTop: 6,
              width: '100%',
              borderRadius: 12,
            }}
          >
            {loading ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--text-muted, #6E687A)',
            fontSize: '0.78rem',
            fontWeight: 500,
          }}
        >
          <ShieldCheck size={14} color="#10B981" />
          <span>Protected by PrettyGlitz Admin Shield</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
