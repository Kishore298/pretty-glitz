import React, { useState, useEffect } from 'react';
import {
  Send,
  Bell,
  Users,
  ShieldCheck,
  Radio,
  Sparkles,
  Smartphone,
  ExternalLink,
  RotateCw,
  Clock,
} from 'lucide-react';
import api from '../utils/api';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const PRESET_TEMPLATES = [
  {
    label: '🎉 Festive Sale (20% OFF)',
    title: '✨ Exclusive Festive Offer: Flat 20% OFF!',
    body: 'Handcrafted Designer Glass Bangles now on special festive sale. Tap to explore our limited collections!',
    url: '/offers',
  },
  {
    label: '✨ New Arrivals Restock',
    title: '💎 Fresh Restock: Designer Glass Bangles',
    body: 'Exciting new colors and artisan designs just arrived in our boutique. Order before stock runs out!',
    url: '/category/Designer%20Glass%20Bangles',
  },
  {
    label: '🚚 Free Express Shipping',
    title: '📦 Free Express Shipping On All Orders Today!',
    body: 'Enjoy zero delivery fees on all orders placed today across India. Handcrafted elegance delivered to your doorstep.',
    url: '/',
  },
  {
    label: '⚡ Flash Hour Sale',
    title: '⚡ 3-Hour Flash Sale Is Live!',
    body: 'Grab exclusive sets at never-before prices. Tap to claim your favorite bangle styles now!',
    url: '/offers',
  },
];

const PushNotifications = () => {
  const [stats, setStats] = useState({
    customerDevicesCount: 0,
    adminDevicesCount: 0,
    totalDevicesCount: 0,
  });
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Form State
  const [targetAudience, setTargetAudience] = useState('CUSTOMERS');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/offers');
  const [imageUrl, setImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile' | 'desktop'

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/notifications/broadcast-stats');
      if (res.data?.success) {
        setStats(res.data.stats || {});
        setRecentBroadcasts(res.data.recentBroadcasts || []);
      }
    } catch (err) {
      console.error('Failed to load broadcast stats:', err);
      toast.error('Could not load subscriber counts');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleApplyPreset = (tpl) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setUrl(tpl.url);
    toast.success(`Template applied: ${tpl.label}`);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a notification title');
      return;
    }
    if (!body.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    const recipientCount =
      targetAudience === 'CUSTOMERS'
        ? stats.customerDevicesCount
        : targetAudience === 'ADMINS'
        ? stats.adminDevicesCount
        : stats.totalDevicesCount;

    if (recipientCount === 0) {
      const proceed = window.confirm(
        `There are currently 0 active ${
          targetAudience === 'CUSTOMERS' ? 'customer' : targetAudience === 'ADMINS' ? 'admin' : ''
        } devices registered. Would you like to proceed anyway?`
      );
      if (!proceed) return;
    }

    setIsSending(true);
    const toastId = toast.loading('Dispatching Firebase Push Broadcast...');

    try {
      const res = await api.post('/notifications/broadcast', {
        targetAudience,
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || '/',
        imageUrl: imageUrl.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(
          `🎉 Broadcast dispatched successfully! Delivered to ${res.data.result?.sent || 0} device(s).`,
          { id: toastId, duration: 4000 }
        );
        // Refresh stats & broadcast history
        fetchStats();
      } else {
        toast.error(res.data?.message || 'Broadcast delivery failed', { id: toastId });
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      toast.error(err.response?.data?.message || 'Failed to dispatch notification', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Custom Push Notification Sender"
        subtitle="Compose and broadcast live push notifications directly to customer devices and store administrators via Firebase Cloud Messaging."
        badge={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            FCM Active
          </span>
        }
        actions={
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 12,
              background: 'var(--surface-elevated, #181722)',
              border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
              color: 'var(--text-secondary, #ACA6B8)',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RotateCw size={15} className={loadingStats ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Subscriber Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {/* Customer Devices */}
        <div
          style={{
            background: 'var(--card-bg, #12111A)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(236, 22, 140, 0.12)',
              color: 'var(--accent-pink, #EC168C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                color: 'var(--text-secondary, #ACA6B8)',
                marginBottom: 2,
              }}
            >
              Storefront Customers
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary, #FAF9FC)',
                lineHeight: 1.1,
              }}
            >
              {loadingStats ? '—' : stats.customerDevicesCount}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginLeft: 6,
                }}
              >
                devices
              </span>
            </div>
          </div>
        </div>

        {/* Admin Devices */}
        <div
          style={{
            background: 'var(--card-bg, #12111A)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(138, 43, 226, 0.12)',
              color: '#A855F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                color: 'var(--text-secondary, #ACA6B8)',
                marginBottom: 2,
              }}
            >
              Store Admins
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary, #FAF9FC)',
                lineHeight: 1.1,
              }}
            >
              {loadingStats ? '—' : stats.adminDevicesCount}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginLeft: 6,
                }}
              >
                devices
              </span>
            </div>
          </div>
        </div>

        {/* Total Reach */}
        <div
          style={{
            background: 'var(--card-bg, #12111A)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.2))',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(201, 168, 76, 0.14)',
              color: 'var(--accent-gold, #C9A84C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Radio size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                color: 'var(--text-secondary, #ACA6B8)',
                marginBottom: 2,
              }}
            >
              Total Reachable
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--accent-gold, #C9A84C)',
                lineHeight: 1.1,
              }}
            >
              {loadingStats ? '—' : stats.totalDevicesCount}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginLeft: 6,
                }}
              >
                active devices
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Composer (Left) + Live Preview (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.95fr)',
          gap: 24,
          alignItems: 'start',
          marginBottom: 36,
        }}
        className="push-grid-responsive"
      >
        {/* COMPOSER CARD */}
        <div
          style={{
            background: 'var(--card-bg, #12111A)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 20,
            padding: '24px 26px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Send size={18} style={{ color: 'var(--accent-pink, #EC168C)' }} />
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary, #FAF9FC)',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Compose Broadcast Alert
            </h2>
          </div>

          <form onSubmit={handleSendBroadcast}>
            {/* Target Audience Selector */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginBottom: 10,
                }}
              >
                Target Audience
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                {[
                  { id: 'CUSTOMERS', label: 'Customers', icon: Users, count: stats.customerDevicesCount },
                  { id: 'ADMINS', label: 'Admins', icon: ShieldCheck, count: stats.adminDevicesCount },
                  { id: 'ALL', label: 'Everyone', icon: Radio, count: stats.totalDevicesCount },
                ].map((aud) => {
                  const Icon = aud.icon;
                  const isSelected = targetAudience === aud.id;
                  return (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 14,
                        border: isSelected
                          ? '1.5px solid var(--accent-pink, #EC168C)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected
                          ? 'rgba(236, 22, 140, 0.12)'
                          : 'var(--surface-elevated, #181722)',
                        color: isSelected ? 'var(--text-primary, #FAF9FC)' : 'var(--text-secondary, #ACA6B8)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Icon size={18} style={{ color: isSelected ? 'var(--accent-pink, #EC168C)' : 'inherit' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{aud.label}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: isSelected ? 'var(--accent-pink, #EC168C)' : 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {loadingStats ? '...' : `${aud.count} devices`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Templates Pill Row */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--accent-gold, #C9A84C)',
                  marginBottom: 8,
                }}
              >
                <Sparkles size={14} />
                Quick Offer Presets
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(tpl)}
                    style={{
                      background: 'rgba(201, 168, 76, 0.08)',
                      border: '1px solid rgba(201, 168, 76, 0.22)',
                      borderRadius: 999,
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--accent-gold, #C9A84C)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Title */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary, #ACA6B8)',
                  }}
                >
                  Notification Title *
                </label>
                <span style={{ fontSize: '0.75rem', color: title.length > 55 ? '#EF4444' : 'var(--text-secondary, #ACA6B8)' }}>
                  {title.length}/65 chars
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={65}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🎉 Weekend Festive Offer: Flat 20% OFF!"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--surface-elevated, #181722)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-primary, #FAF9FC)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            {/* Notification Body */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary, #ACA6B8)',
                  }}
                >
                  Message Body *
                </label>
                <span style={{ fontSize: '0.75rem', color: body.length > 160 ? '#EF4444' : 'var(--text-secondary, #ACA6B8)' }}>
                  {body.length}/180 chars
                </span>
              </div>
              <textarea
                required
                rows={3}
                maxLength={180}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write an enticing push alert for your subscribers..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--surface-elevated, #181722)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-primary, #FAF9FC)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            {/* Click Redirect Link */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginBottom: 6,
                }}
              >
                Target Click URL
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/offers, /category/..., or custom link"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: 12,
                    background: 'var(--surface-elevated, #181722)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-primary, #FAF9FC)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                <ExternalLink
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary, #ACA6B8)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            {/* Optional Banner Image URL */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary, #ACA6B8)',
                  marginBottom: 6,
                }}
              >
                Banner Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (Cloudinary, web image for rich push)"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--surface-elevated, #181722)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-primary, #FAF9FC)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSending}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                border: 'none',
                color: '#FAF9FC',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.02em',
                cursor: isSending ? 'not-allowed' : 'pointer',
                opacity: isSending ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 8px 25px rgba(236, 22, 140, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Send size={18} />
              {isSending ? 'Broadcasting...' : `Send Push to ${targetAudience}`}
            </button>
          </form>
        </div>

        {/* LIVE PREVIEW CARD */}
        <div
          style={{
            background: 'var(--card-bg, #12111A)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 20,
            padding: '24px 22px',
            position: 'sticky',
            top: 24,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} style={{ color: 'var(--accent-gold, #C9A84C)' }} />
              <h3
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #FAF9FC)',
                  margin: 0,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                Live Device Preview
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: previewDevice === 'mobile' ? 'rgba(236, 22, 140, 0.2)' : 'transparent',
                  color: previewDevice === 'mobile' ? '#FAF9FC' : 'var(--text-secondary, #ACA6B8)',
                  cursor: 'pointer',
                }}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: previewDevice === 'desktop' ? 'rgba(236, 22, 140, 0.2)' : 'transparent',
                  color: previewDevice === 'desktop' ? '#FAF9FC' : 'var(--text-secondary, #ACA6B8)',
                  cursor: 'pointer',
                }}
              >
                Desktop
              </button>
            </div>
          </div>

          {/* Realistic Notification Banner Preview */}
          <div
            style={{
              background: '#1F1E29',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Header / Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src="/pretty-glitz-logo.png"
                  alt="PrettyGlitz"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: 'var(--accent-pink, #EC168C)',
                    textTransform: 'uppercase',
                  }}
                >
                  PRETTYGLITZ • NOW
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                FCM Push
              </span>
            </div>

            {/* Notification Title */}
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.94rem',
                fontWeight: 700,
                color: '#FAF9FC',
                marginBottom: 4,
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {title.trim() || '✨ PrettyGlitz Special Alert'}
            </div>

            {/* Notification Body */}
            <div
              style={{
                fontSize: '0.84rem',
                color: '#D4CEE0',
                lineHeight: 1.4,
                marginBottom: imageUrl ? 10 : 8,
                wordBreak: 'break-word',
              }}
            >
              {body.trim() || 'Your customized push notification body will appear here in real time.'}
            </div>

            {/* Optional Banner Image Preview */}
            {imageUrl && (
              <div
                style={{
                  width: '100%',
                  height: 120,
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 10,
                  background: '#12111A',
                }}
              >
                <img
                  src={imageUrl}
                  alt="Banner preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Target URL indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(201, 168, 76, 0.1)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                fontSize: '0.74rem',
                color: 'var(--accent-gold, #C9A84C)',
                fontWeight: 600,
              }}
            >
              <ExternalLink size={12} />
              Opens: {url || '/'}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary, #ACA6B8)',
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Pro-tip:</strong> Push notifications are delivered directly to subscribers' device notifications tray even when they aren't on the website.
          </div>
        </div>
      </div>

      {/* Broadcast History Section */}
      <div
        style={{
          background: 'var(--card-bg, #12111A)',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          borderRadius: 20,
          padding: '24px 26px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} style={{ color: 'var(--accent-gold, #C9A84C)' }} />
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary, #FAF9FC)',
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Recent Broadcast History
            </h2>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #ACA6B8)' }}>
            Last {recentBroadcasts.length} broadcasts
          </span>
        </div>

        {recentBroadcasts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 20px',
              color: 'var(--text-secondary, #ACA6B8)',
              fontSize: '0.88rem',
            }}
          >
            <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div>No previous broadcasts sent yet. Use the composer above to dispatch your first push notification!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.86rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary, #ACA6B8)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  <th style={{ padding: '10px 14px' }}>Date & Time</th>
                  <th style={{ padding: '10px 14px' }}>Audience</th>
                  <th style={{ padding: '10px 14px' }}>Notification</th>
                  <th style={{ padding: '10px 14px' }}>Target Link</th>
                  <th style={{ padding: '10px 14px' }}>Delivery</th>
                  <th style={{ padding: '10px 14px' }}>Sent By</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBroadcasts.map((b) => (
                  <tr
                    key={b._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px', color: 'var(--text-secondary, #ACA6B8)', whiteSpace: 'nowrap' }}>
                      {new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background:
                            b.targetAudience === 'CUSTOMERS'
                              ? 'rgba(236, 22, 140, 0.14)'
                              : b.targetAudience === 'ADMINS'
                              ? 'rgba(138, 43, 226, 0.14)'
                              : 'rgba(201, 168, 76, 0.14)',
                          color:
                            b.targetAudience === 'CUSTOMERS'
                              ? '#EC168C'
                              : b.targetAudience === 'ADMINS'
                              ? '#A855F7'
                              : '#C9A84C',
                        }}
                      >
                        {b.targetAudience}
                      </span>
                    </td>
                    <td style={{ padding: '14px', minWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: '#FAF9FC', marginBottom: 2 }}>
                        {b.title}
                      </div>
                      <div
                        style={{
                          color: 'var(--text-secondary, #ACA6B8)',
                          fontSize: '0.8rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {b.body}
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--accent-gold, #C9A84C)', whiteSpace: 'nowrap' }}>
                      {b.url || '/'}
                    </td>
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#10B981', fontWeight: 600 }}>{b.sentCount || 0} sent</span>
                      {b.failedCount > 0 && (
                        <span style={{ color: '#EF4444', fontSize: '0.78rem', marginLeft: 6 }}>
                          ({b.failedCount} failed)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary, #ACA6B8)', whiteSpace: 'nowrap' }}>
                      {b.sentBy || 'Admin'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(b.title);
                          setBody(b.body);
                          setUrl(b.url || '/');
                          setTargetAudience(b.targetAudience || 'CUSTOMERS');
                          if (b.imageUrl) setImageUrl(b.imageUrl);
                          toast.success('Loaded broadcast into composer!');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          padding: '4px 10px',
                          color: '#FAF9FC',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PushNotifications;
