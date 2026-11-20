import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Edit2,
  CheckCircle,
  AlertCircle,
  KeyRound,
  MessageCircle,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const { user, sendOtp, verifyOtp } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/account';

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanMobile);
      if (res.success) {
        setStep('otp');
        setCooldown(30);
        setSuccessMsg(res.message || 'OTP sent! You can also use test OTP 1234.');
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the OTP.');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const res = await verifyOtp(cleanMobile, cleanOtp, name.trim());
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Invalid OTP code. Try entering 1234.');
      }
    } catch {
      setError('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const res = await sendOtp(cleanMobile);
      if (res.success) {
        setCooldown(30);
        setSuccessMsg('A new OTP has been sent. Test code: 1234.');
      } else {
        setError(res.message || 'Could not resend OTP.');
      }
    } catch {
      setError('Error resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '82vh',
        background: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--nav-height, 76px) + 20px) 16px 60px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '32px 28px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(196, 56, 108, 0.12)',
                color: 'var(--accent, #C4386C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              {step === 'phone' ? <Phone size={24} /> : <KeyRound size={24} />}
            </div>

            <h1
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 'clamp(1.7rem, 4vw, 2.2rem)',
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 6px',
                lineHeight: 1.15,
              }}
            >
              {step === 'phone' ? 'Customer Login' : 'Verify WhatsApp OTP'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
              {step === 'phone'
                ? 'Enter your mobile number to receive a one-time WhatsApp OTP'
                : `Enter the code sent to your WhatsApp on +91 ${mobile.replace(/\D/g, '').slice(-10)}`}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10B981',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </motion.div>
          )}

          {/* STEP 1: MOBILE ENTRY */}
          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.form
                key="step-phone"
                onSubmit={handleMobileSubmit}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Mobile Number
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      height: 48,
                      padding: '0 14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--accent, #C4386C)',
                        paddingRight: 10,
                        borderRight: '1px solid var(--border)',
                        userSelect: 'none',
                      }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        paddingLeft: 12,
                        letterSpacing: '0.04em',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      height: 48,
                      padding: '0 14px',
                      outline: 'none',
                      color: 'var(--text)',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                    }}
                  />
                </div>

                {/* Test OTP notice */}
                <div
                  style={{
                    background: 'rgba(223, 184, 71, 0.1)',
                    border: '1px solid rgba(223, 184, 71, 0.3)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: '0.76rem',
                    color: isDark ? '#E5C35A' : '#926C00',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} style={{ flexShrink: 0 }} />
                  <span>Instant login: OTP <strong>1234</strong> is always accepted.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || mobile.replace(/\D/g, '').length < 10}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: loading || mobile.replace(/\D/g, '').length < 10 ? 'not-allowed' : 'pointer',
                    opacity: loading || mobile.replace(/\D/g, '').length < 10 ? 0.6 : 1,
                    boxShadow: '0 4px 18px rgba(196, 56, 108, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MessageCircle size={17} />
                  <span>{loading ? 'Sending WhatsApp OTP...' : 'Send WhatsApp OTP'}</span>
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <motion.form
                key="step-otp"
                onSubmit={handleOtpSubmit}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Mobile number chip with Edit button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Mobile: <strong style={{ color: 'var(--text)' }}>+91 {mobile}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                      setOtp('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent, #C4386C)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <Edit2 size={12} /> Change
                  </button>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Enter WhatsApp OTP
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    style={{
                      width: '100%',
                      background: 'var(--bg-main)',
                      border: '2px solid var(--accent, #C4386C)',
                      borderRadius: 12,
                      height: 52,
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      letterSpacing: '0.3em',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Test OTP Quick Fill Button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setOtp('1234')}
                    style={{
                      background: 'rgba(196, 56, 108, 0.08)',
                      border: '1px dashed var(--accent, #C4386C)',
                      borderRadius: 999,
                      padding: '4px 14px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--accent, #C4386C)',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Auto-fill Test OTP (1234)
                  </button>
                </div>

                {/* Resend timer */}
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {cooldown > 0 ? (
                    <span>Resend code in <strong>{cooldown}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent, #C4386C)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <RotateCcw size={13} /> Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp.trim()}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: loading || !otp.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !otp.trim() ? 0.6 : 1,
                    boxShadow: '0 4px 18px rgba(196, 56, 108, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Proceed'}</span>
                  <ShieldCheck size={17} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
