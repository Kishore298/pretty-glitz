import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  User,
  MessageCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const {
    login,
    setPassword,
    user,
    isWhatsAppOtpEnabled,
    sendWhatsAppOtp,
    verifyWhatsAppOtp,
  } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/account';

  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'whatsapp'
  const [mobile, setMobile] = useState('');
  const [password, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // WhatsApp OTP state
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'verify'
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');

  // Legacy password setup state
  const [isLegacySetup, setIsLegacySetup] = useState(false);
  const [legacyName, setLegacyName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

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

  const handleSendWhatsAppOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendWhatsAppOtp(cleanMobile);
      if (res.success) {
        setOtpStep('verify');
        setCooldown(res.cooldownSeconds || 60);
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
      } else {
        setError(res.message || 'Failed to dispatch WhatsApp OTP.');
      }
    } catch (err) {
      setError('Failed to dispatch OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWhatsAppOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter the 6-digit OTP received on WhatsApp.');
      return;
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const res = await verifyWhatsAppOtp(cleanMobile, cleanOtp);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Invalid OTP code.');
      }
    } catch (err) {
      setError('An error occurred during verification.');
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
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'calc(76px + 40px)',
        paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 40px)',
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
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
          boxShadow: isDark
            ? '0 12px 36px rgba(0,0,0,0.45)'
            : '0 12px 36px rgba(26,17,24,0.06)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(196,56,108,0.15), rgba(138,43,226,0.15))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              marginBottom: 14,
            }}
          >
            {isLegacySetup ? (
              <ShieldCheck size={24} />
            ) : authMethod === 'whatsapp' ? (
              <MessageCircle size={24} color="#25D366" />
            ) : (
              <User size={24} />
            )}
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 6px',
            }}
          >
            {isLegacySetup ? 'Secure Your Account' : 'Welcome Back'}
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {isLegacySetup
              ? `Hi ${legacyName || 'there'}! Please create a password to complete account security.`
              : 'Sign in to access your saved cart, orders, and wishlist.'}
          </p>
        </div>

        {/* Feature-flagged Tabs (Only rendered when WhatsApp OTP is enabled) */}
        {!isLegacySetup && isWhatsAppOtpEnabled && (
          <div
            style={{
              display: 'flex',
              background: isDark ? 'rgba(255,255,255,0.04)' : '#F5F3EF',
              padding: 4,
              borderRadius: 12,
              marginBottom: 22,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 9,
                border: 'none',
                background: authMethod === 'password'
                  ? (isDark ? '#232230' : '#FFFFFF')
                  : 'transparent',
                color: authMethod === 'password' ? 'var(--text)' : 'var(--text-secondary)',
                fontWeight: authMethod === 'password' ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: authMethod === 'password' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Lock size={14} />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('whatsapp');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 9,
                border: 'none',
                background: authMethod === 'whatsapp'
                  ? (isDark ? '#232230' : '#FFFFFF')
                  : 'transparent',
                color: authMethod === 'whatsapp' ? 'var(--text)' : 'var(--text-secondary)',
                fontWeight: authMethod === 'whatsapp' ? 600 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: authMethod === 'whatsapp' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageCircle size={14} color="#25D366" />
              <span>WhatsApp OTP</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              fontSize: '0.82rem',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 20,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Developer Simulation Hint */}
        {devOtpHint && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: '0.82rem',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={16} />
            <span>Dev Simulation OTP: <strong>{devOtpHint}</strong></span>
          </div>
        )}

        {/* Form Body */}
        {isLegacySetup ? (
          /* Legacy Set Password Form */
          <form onSubmit={handleSetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                New Password (min 8 chars, 1 uppercase, 1 number)
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
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
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
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
        ) : authMethod === 'whatsapp' ? (
          /* WhatsApp OTP Login Form */
          <div>
            {otpStep === 'phone' ? (
              <form onSubmit={handleSendWhatsAppOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Mobile Number (WhatsApp)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    >
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
                        padding: '12px 14px 12px 46px',
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
                  disabled={loading || cooldown > 0}
                  style={{
                    marginTop: 8,
                    padding: '13px 20px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
                    opacity: loading || cooldown > 0 ? 0.75 : 1,
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <MessageCircle size={18} />
                  <span>
                    {loading
                      ? 'Sending Code...'
                      : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : 'Send OTP on WhatsApp'}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyWhatsAppOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpStep('phone')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Change Number
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <KeyRound size={17} />
                    </span>
                    <input
                      type="text"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 46px',
                        borderRadius: 12,
                        border: `1px solid var(--border)`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                        color: 'var(--text)',
                        fontSize: '1.1rem',
                        letterSpacing: '0.25em',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  style={{
                    marginTop: 8,
                    padding: '13px 20px',
                    borderRadius: 12,
                    background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: loading || otp.length < 6 ? 0.75 : 1,
                    boxShadow: '0 4px 14px rgba(196,56,108,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  {!loading && <ArrowRight size={17} />}
                </button>

                {/* Resend Action */}
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  {cooldown > 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Resend OTP available in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendWhatsAppOtp}
                      disabled={loading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Resend OTP Code</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Normal Phone + Password Login Form (Default) */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Mobile Input */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
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
                    padding: '12px 14px 12px 46px',
                    borderRadius: 12,
                    border: `1px solid var(--border)`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
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
                    padding: '12px 46px 12px 46px',
                    borderRadius: 12,
                    border: `1px solid var(--border)`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#FBF9F6',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
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
        )}

        {/* Footer Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid var(--border)`,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
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
