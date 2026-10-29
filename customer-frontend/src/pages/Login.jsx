import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const { login, setPassword, user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/account';

  const [mobile, setMobile] = useState('');
  const [password, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Legacy password setup state
  const [isLegacySetup, setIsLegacySetup] = useState(false);
  const [legacyName, setLegacyName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanMobile, password);
      if (res.success) {
        navigate(from, { replace: true });
      } else if (res.needsPasswordSetup) {
        setIsLegacySetup(true);
        setLegacyName(res.name || '');
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const cleanMobile = mobile.trim().replace(/\D/g, '');
      const res = await setPassword(cleanMobile, newPassword, confirmPassword);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Failed to set password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during password setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 'calc(76px + 40px)',
      paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 40px)',
      paddingLeft: 20,
      paddingRight: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: isDark ? 'var(--bg-secondary, #14141C)' : '#FFFFFF',
          border: `1px solid var(--border)`,
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(26,17,24,0.06)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(196,56,108,0.15), rgba(138,43,226,0.15))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            marginBottom: 14,
          }}>
            {isLegacySetup ? <ShieldCheck size={24} /> : <User size={24} />}
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}>
            {isLegacySetup ? 'Secure Your Account' : 'Welcome Back'}
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {isLegacySetup
              ? `Hi ${legacyName || 'there'}! Please create a password to complete account security.`
              : 'Sign in to access your saved cart, orders, and wishlist.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
            fontSize: '0.82rem',
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 20,
            lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {/* Normal Login Form */}
        {!isLegacySetup ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Mobile Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Phone size={17} />
                </span>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={15}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 12,
                    border: `1px solid var(--border)`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Lock size={17} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: 12,
                    border: `1px solid var(--border)`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: '13px 20px',
                borderRadius: 12,
                background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(196,56,108,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        ) : (
          /* Legacy Set Password Form */
          <form onSubmit={handleSetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                New Password (min 8 chars, 1 uppercase, 1 number)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Lock size={17} />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: 12,
                    border: `1px solid var(--border)`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Lock size={17} />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 12,
                    border: `1px solid var(--border)`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: '13px 20px',
                borderRadius: 12,
                background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(196,56,108,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? 'Saving password...' : 'Save Password & Continue'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          paddingTop: 20,
          borderTop: `1px solid var(--border)`,
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--accent)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Create an Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
