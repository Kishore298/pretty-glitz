import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Video,
  Clock,
  CheckCircle,
  HelpCircle,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BRAND_EMAIL, WHATSAPP_DISPLAY_NUMBER, getWhatsAppUrl } from '../config/constants';

const TAB_CONFIG = [
  {
    id: 'shipping',
    label: 'Shipping Policy',
    path: '/shipping-policy',
    icon: Truck,
  },
  {
    id: 'return-refund',
    label: 'Return & Cancellation',
    path: '/cancellation-refund-policy',
    altPath: '/return-refund-policy',
    icon: RotateCcw,
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    path: '/privacy-policy',
    icon: ShieldCheck,
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    path: '/terms-and-conditions',
    altPath: '/terms',
    icon: FileText,
  },
];

const Policies = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const currentPath = location.pathname.toLowerCase();
  let activeTabId = 'shipping';
  if (currentPath.includes('cancellation') || currentPath.includes('return') || currentPath.includes('refund')) {
    activeTabId = 'return-refund';
  } else if (currentPath.includes('privacy')) {
    activeTabId = 'privacy';
  } else if (currentPath.includes('terms')) {
    activeTabId = 'terms';
  } else if (currentPath.includes('shipping')) {
    activeTabId = 'shipping';
  }

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTabId]);

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  return (
    <div
      style={{
        minHeight: '85vh',
        background: isDark ? 'var(--bg-primary, #0c0a10)' : 'var(--bg-primary, #FDFBF7)',
        color: 'var(--text)',
        paddingBottom: 80,
      }}
    >
      {/* Hero Header */}
      <section
        style={{
          position: 'relative',
          padding: '60px 20px 40px',
          textAlign: 'center',
          background: isDark
            ? 'linear-gradient(180deg, rgba(196,56,108,0.12) 0%, rgba(12,10,16,0) 100%)'
            : 'linear-gradient(180deg, rgba(196,56,108,0.06) 0%, rgba(253,251,247,0) 100%)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.82rem',
              color: 'var(--text-secondary, #888)',
              marginBottom: 14,
            }}
          >
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Home
            </Link>
            <ChevronRight size={13} />
            <span>Policies & Customer Care</span>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--accent, #C4386C)', fontWeight: 600 }}>
              {TAB_CONFIG.find((t) => t.id === activeTabId)?.label}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2rem, 4vw, 2.85rem)',
              fontWeight: 700,
              margin: '0 0 10px',
              letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #C4386C, #8A2BE2, #C9A84C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PrettyGlitz Policies & Care
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: isDark ? 'rgba(255,255,255,0.7)' : '#665C52',
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Clear, transparent commitments to protect your shopping experience with our handcrafted jewellery.
          </p>

          {/* Policy Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 32,
            }}
          >
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 999,
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    border: isActive
                      ? '1.5px solid var(--accent, #C4386C)'
                      : isDark
                      ? '1px solid rgba(255,255,255,0.12)'
                      : '1px solid rgba(0,0,0,0.1)',
                    background: isActive
                      ? 'var(--accent, #C4386C)'
                      : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.85)',
                    color: isActive ? '#FFFFFF' : 'var(--text)',
                    boxShadow: isActive ? '0 4px 14px rgba(196,56,108,0.32)' : 'none',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ maxWidth: 880, margin: '40px auto 0', padding: '0 20px' }}>
        {/* ── 1. SHIPPING POLICY ── */}
        {activeTabId === 'shipping' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="policy-content"
          >
            <div className="policy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div className="policy-icon-badge">
                  <Truck size={22} color="var(--accent)" />
                </div>
                <div>
                  <h2 className="policy-section-title">Shipping & Delivery Policy</h2>
                  <p className="policy-last-updated">Last Updated: November 2026</p>
                </div>
              </div>

              <p className="policy-paragraph">
                At <strong>PrettyGlitz</strong>, we are committed to delivering your handcrafted jewellery safely, promptly, and securely. Every piece is crafted and inspected with exceptional attention to detail before leaving our workshop.
              </p>

              {/* Highlights Grid */}
              <div className="policy-info-grid">
                <div className="policy-info-box">
                  <Clock size={20} color="var(--accent)" />
                  <h4>Processing Time</h4>
                  <p>1 working day for order verification & production scheduling.</p>
                </div>
                <div className="policy-info-box">
                  <CheckCircle size={20} color="#10B981" />
                  <h4>Production Time</h4>
                  <p>07 - 12 working days (all bangles & jewellery are made-to-order).</p>
                </div>
                <div className="policy-info-box">
                  <Truck size={20} color="#8A2BE2" />
                  <h4>Delivery Window</h4>
                  <p>7 - 15 working days maximum across India with live tracking.</p>
                </div>
              </div>

              <h3 className="policy-subheading">1. Order Processing Time</h3>
              <p className="policy-paragraph">
                All orders placed on PrettyGlitz are reviewed and processed within <strong>1 business day</strong> of order placement. Once processed, our master artisans begin the production workflow. Please note that processing does not take place on Sundays or declared national holidays.
              </p>

              <h3 className="policy-subheading">2. Made-to-Order Production (07 - 12 Working Days)</h3>
              <p className="policy-paragraph">
                Because our bridal, stone, silk thread, and designer glass bangles are individually hand-curated to your requested dimensions and color specifications, please allow <strong>07 - 12 working days</strong> for careful production before your order is handed over to our courier partners. Custom sets or bulk bridal orders may require additional craft time.
              </p>

              <div className="policy-notice-box notice-warning">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Special Notice on Silk Thread Bangles:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                    Silk thread bangles require intricate multi-layer thread binding and drying periods. Immediate same-day dispatch is <em>not possible</em> for silk thread collections to ensure the thread remains immaculate and long-lasting.
                  </p>
                </div>
              </div>

              <h3 className="policy-subheading">3. Courier Partners & Tracking</h3>
              <p className="policy-paragraph">
                We partner with premier courier networks (including DTDC, BlueDart, Delhivery, and India Post Speed Post) to guarantee reliable handling of delicate jewellery. As soon as your order is dispatched, a <strong>Tracking ID</strong> along with courier partner details will be sent to your registered email address and WhatsApp number.
              </p>

              <h3 className="policy-subheading">4. Shipping Charges</h3>
              <p className="policy-paragraph">
                Shipping rates are calculated transparently during checkout based on your delivery PIN code and parcel weight. Shipping charges are non-refundable, except in verified cases where an item is damaged upon delivery and verified by our mandatory unboxing video inspection.
              </p>

              <h3 className="policy-subheading">5. International Orders</h3>
              <p className="policy-paragraph">
                We ship to selected international destinations including the US, UK, UAE, Singapore, Malaysia, and Canada. <strong>International orders are exclusively coordinated via WhatsApp</strong> to tailor customs declarations and calculate exact international freight. Contact our concierge at <code>{WHATSAPP_DISPLAY_NUMBER}</code> for international inquiries.
              </p>

              <h3 className="policy-subheading">6. Accurate Shipping Address</h3>
              <p className="policy-paragraph">
                Please ensure your full name, complete door/street address, nearest landmark, and accurate 6-digit postal PIN code are provided. PrettyGlitz is not liable for delivery delays or failed drop-offs resulting from incomplete or inaccurate address details entered by the customer.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── 2. RETURN, REFUND & CANCELLATION POLICY ── */}
        {activeTabId === 'return-refund' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="policy-content"
          >
            <div className="policy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div className="policy-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
                  <RotateCcw size={22} color="#EF4444" />
                </div>
                <div>
                  <h2 className="policy-section-title">Cancellation, Return & Refund Policy</h2>
                  <p className="policy-last-updated">Strict Quality & Damage Policy</p>
                </div>
              </div>

              {/* CRITICAL NOTICE 1: NO CANCELLATION */}
              <div className="policy-alert-banner alert-danger">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 800 }}>
                      1. Orders Cannot Be Cancelled Once Placed
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
                      Due to the customized and made-to-order nature of PrettyGlitz jewellery, production commences immediately upon order placement. <strong>Once an order is confirmed, it CANNOT be cancelled, modified, or refunded under any circumstances.</strong> Please double-check your sizing, selected color variations, and delivery details before placing your order.
                    </p>
                  </div>
                </div>
              </div>

              {/* CRITICAL NOTICE 2: MANDATORY OPENING VIDEO */}
              <div className="policy-alert-banner alert-warning" style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Video size={24} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 800 }}>
                      2. Mandatory Unboxing / Opening Video Required for Damage Claims
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
                      Returns, replacements, or refunds are permitted <strong>ONLY for damaged products</strong>. A clear, continuous <strong>opening/unboxing video</strong> from start to finish is <strong>STRICTLY MANDATORY</strong>. Without a valid, uncut opening video, no return, replacement, or refund request will be accepted.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="policy-subheading" style={{ marginTop: 30 }}>
                Unboxing Video Guidelines & Rules
              </h3>
              <p className="policy-paragraph">
                To prevent fraudulent claims and ensure fair resolutions, your opening video must strictly adhere to the following conditions:
              </p>

              <ul className="policy-checklist">
                <li>
                  <strong>Start Before Opening:</strong> The video must show the completely sealed outer parcel from all 360° angles prior to any cut or puncture.
                </li>
                <li>
                  <strong>Legible Shipping Label:</strong> The shipping label containing the Tracking ID, your name, and PrettyGlitz details must be clearly readable on camera for at least 3 seconds.
                </li>
                <li>
                  <strong>No Cuts or Edits:</strong> The video must be recorded in <strong>one single, continuous, unbroken take</strong> without pauses, edits, speed alterations, or jump-cuts.
                </li>
                <li>
                  <strong>Open and Inspect on Camera:</strong> Cut open the seal, unwrap the inner bubble wrap, open the jewellery container, and show the damaged item clearly on camera.
                </li>
                <li>
                  <strong>Timestamp:</strong> Video must be recorded and submitted within <strong>24 to 48 hours</strong> of package delivery as marked by the courier partner.
                </li>
              </ul>

              <h3 className="policy-subheading">Non-Eligible Scenarios</h3>
              <p className="policy-paragraph">
                Please note that returns or replacements are <strong>NOT</strong> granted for:
              </p>
              <ul className="policy-bullet-list">
                <li>Sizing errors made during purchase (please refer to our Bangle Size Chart modal).</li>
                <li>Minor aesthetic variations inherent to handmade crafts (subtle tone variations in natural stones or silk thread).</li>
                <li>Change of mind after shipment or delivery.</li>
                <li>Packages opened prior to recording the video.</li>
              </ul>

              <h3 className="policy-subheading">How to Submit a Damage Claim</h3>
              <p className="policy-paragraph">
                If your product arrived broken or damaged in transit:
              </p>
              <ol className="policy-ordered-list">
                <li>
                  Contact our support team within <strong>48 hours</strong> of delivery via WhatsApp at <code>{WHATSAPP_DISPLAY_NUMBER}</code> or email <code>{BRAND_EMAIL}</code>.
                </li>
                <li>Share your <strong>Order ID</strong>, full name, and the unedited <strong>Unboxing Video file</strong>.</li>
                <li>Our verification team will review the footage within <strong>24 business hours</strong>.</li>
                <li>
                  Upon verification, we will immediately dispatch a <strong>free replacement</strong> or process a <strong>100% refund</strong> to your original payment mode within 5-7 business days.
                </li>
              </ol>
            </div>
          </motion.div>
        )}

        {/* ── 3. PRIVACY POLICY ── */}
        {activeTabId === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="policy-content"
          >
            <div className="policy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div className="policy-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
                  <ShieldCheck size={22} color="#10B981" />
                </div>
                <div>
                  <h2 className="policy-section-title">Privacy Policy</h2>
                  <p className="policy-last-updated">Effective Date: November 2026</p>
                </div>
              </div>

              <p className="policy-paragraph">
                <strong>PrettyGlitz Collections</strong> respects your privacy and is dedicated to protecting your personal data. This Privacy Policy describes how we collect, handle, and safeguard your information when you visit our website, purchase accessories, or communicate with our team.
              </p>

              <h3 className="policy-subheading">1. Personal Information We Collect</h3>
              <p className="policy-paragraph">We collect personal information that you provide to us directly:</p>
              <ul className="policy-bullet-list">
                <li><strong>Contact details:</strong> Name, phone number, shipping address, billing address, and email address.</li>
                <li><strong>Account details:</strong> Login credentials, saved addresses, wishlist items, and order history.</li>
                <li><strong>Communication details:</strong> Inquiries submitted via WhatsApp, email, or customer care channels.</li>
                <li><strong>Device & Browsing information:</strong> IP address, browser type, operating system, and pages viewed to optimize site speed and performance.</li>
              </ul>

              <h3 className="policy-subheading">2. Payment Security & Financial Details</h3>
              <p className="policy-paragraph">
                PrettyGlitz never stores or retains your raw credit card numbers, debit card numbers, UPI PINs, or bank passwords on our servers. All digital payments are processed through PCI-DSS compliant payment gateways with bank-grade 256-bit SSL encryption.
              </p>

              <h3 className="policy-subheading">3. How We Use Your Information</h3>
              <p className="policy-paragraph">Your information is used strictly to:</p>
              <ul className="policy-bullet-list">
                <li>Fulfill, craft, pack, and ship your jewellery orders.</li>
                <li>Send order confirmations, tracking numbers, and delivery notifications via SMS, Email, and WhatsApp.</li>
                <li>Send exclusive discount promotions, VIP previews, and new collection launches (only if you subscribe to our newsletter).</li>
                <li>Detect and prevent fraud, unauthorized transactions, or security breaches.</li>
              </ul>

              <h3 className="policy-subheading">4. Zero Third-Party Selling</h3>
              <p className="policy-paragraph">
                We respect your trust. <strong>We will NEVER sell, lease, or trade your personal email, phone number, or details to third-party marketers or advertisers.</strong> Information is only shared with verified logistics partners (couriers) strictly for delivery purposes.
              </p>

              <h3 className="policy-subheading">5. Your Privacy Rights & Unsubscribing</h3>
              <p className="policy-paragraph">
                You have the full right to request access to the personal data we hold about you, request corrections, or request account deletion. You can unsubscribe from promotional emails at any time by clicking the unsubscribe link or emailing <code>{BRAND_EMAIL}</code>.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── 4. TERMS & CONDITIONS ── */}
        {activeTabId === 'terms' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="policy-content"
          >
            <div className="policy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div className="policy-icon-badge" style={{ background: 'rgba(138, 43, 226, 0.12)' }}>
                  <FileText size={22} color="#8A2BE2" />
                </div>
                <div>
                  <h2 className="policy-section-title">Terms & Conditions of Service</h2>
                  <p className="policy-last-updated">PrettyGlitz Store Agreement</p>
                </div>
              </div>

              <p className="policy-paragraph">
                Welcome to <strong>PrettyGlitz</strong>. By visiting our website, browsing our product catalog, or purchasing our handcrafted accessories, you agree to be bound by the following Terms & Conditions.
              </p>

              <h3 className="policy-subheading">1. Handcrafted Nature & Variations</h3>
              <p className="policy-paragraph">
                Every PrettyGlitz piece is artisanal and hand-assembled. Subtle variations in stone placement, gemstone hue, thread wrap tightness, or metallic sheen are celebrated hallmarks of authentic handcrafted artistry and do not constitute manufacturing defects. While we display high-definition studio photography, display colors may vary slightly across different monitor calibrations.
              </p>

              <h3 className="policy-subheading">2. Sizing Responsibility</h3>
              <p className="policy-paragraph">
                Bangle sizing varies across traditional Indian measurements (e.g., 2.4, 2.6, 2.8, 2.10). We provide a comprehensive <strong>Bangle Size Chart</strong> and measurement guide. It is the customer's responsibility to verify their size prior to ordering. Size-exchange requests are not eligible under our return policy.
              </p>

              <h3 className="policy-subheading">3. Pricing & Payment</h3>
              <p className="policy-paragraph">
                All prices are listed in Indian Rupees (₹ INR) inclusive of applicable taxes unless indicated otherwise. PrettyGlitz reserves the right to revise product prices, discontinue models, or update promotional offers without prior notice.
              </p>

              <h3 className="policy-subheading">4. Intellectual Property</h3>
              <p className="policy-paragraph">
                All designs, logos, product names, photography, illustrations, text, and website graphics are the intellectual property of PrettyGlitz Collections. Unauthorized reproduction, downloading for commercial reuse, or re-publishing without express written permission is strictly prohibited under applicable copyright laws.
              </p>

              <h3 className="policy-subheading">5. Governing Law</h3>
              <p className="policy-paragraph">
                These terms are governed by the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or relating to this store shall be subject to the exclusive jurisdiction of the competent courts in Tamil Nadu, India.
              </p>
            </div>
          </motion.div>
        )}

        {/* Need Help Banner */}
        <div className="policy-contact-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="policy-contact-icon">
              <HelpCircle size={28} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>
                Have questions about our policies?
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#666' }}>
                Our customer concierge is available Monday to Saturday to assist you with order inquiries.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <a
              href={getWhatsAppUrl('Hi PrettyGlitz, I have a question regarding your policies') || `https://wa.me/917010737706?text=Hi%20PrettyGlitz%2C%20I%20have%20a%20question%20regarding%20your%20policies`}
              target="_blank"
              rel="noopener noreferrer"
              className="policy-contact-btn btn-wa"
            >
              WhatsApp Support
            </a>
            <a
              href={`mailto:${BRAND_EMAIL}?subject=PrettyGlitz%20Policy%20Inquiry`}
              className="policy-contact-btn btn-mail"
            >
              <Mail size={15} />
              <span>Email Support</span>
            </a>
          </div>
        </div>
      </main>

      <style>{`
        .policy-content {
          width: 100%;
        }

        .policy-card {
          background: ${isDark ? 'var(--card-bg, #14131D)' : '#FFFFFF'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'};
          border-radius: 18px;
          padding: 32px 30px;
          box-shadow: ${isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(196,56,108,0.05)'};
        }

        @media (max-width: 640px) {
          .policy-card {
            padding: 22px 18px;
          }
        }

        .policy-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: ${isDark ? 'rgba(196,56,108,0.18)' : 'rgba(196,56,108,0.1)'};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .policy-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.65rem;
          font-weight: 700;
          margin: 0;
          color: var(--text);
        }

        .policy-last-updated {
          font-size: 0.78rem;
          color: var(--text-secondary, #888);
          margin: 2px 0 0;
        }

        .policy-paragraph {
          font-size: 0.92rem;
          line-height: 1.7;
          color: ${isDark ? 'rgba(255,255,255,0.85)' : '#4A4035'};
          margin: 0 0 16px;
        }

        .policy-subheading {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
          margin: 26px 0 10px;
          letter-spacing: -0.01em;
        }

        .policy-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }

        .policy-info-box {
          background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(196,56,108,0.03)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(196,56,108,0.12)'};
          border-radius: 14px;
          padding: 16px;
          text-align: left;
        }

        .policy-info-box h4 {
          font-size: 0.92rem;
          font-weight: 700;
          margin: 8px 0 4px;
          color: var(--text);
        }

        .policy-info-box p {
          font-size: 0.82rem;
          color: var(--text-secondary, #888);
          margin: 0;
          line-height: 1.5;
        }

        .policy-alert-banner {
          border-radius: 14px;
          padding: 18px 20px;
        }

        .policy-alert-banner.alert-danger {
          background: ${isDark ? 'rgba(239,68,68,0.14)' : '#FEF2F2'};
          border: 1.5px solid rgba(239,68,68,0.35);
          color: ${isDark ? '#FCA5A5' : '#991B1B'};
        }

        .policy-alert-banner.alert-warning {
          background: ${isDark ? 'rgba(217,119,6,0.14)' : '#FFFBEB'};
          border: 1.5px solid rgba(217,119,6,0.35);
          color: ${isDark ? '#FCD34D' : '#92400E'};
        }

        .policy-notice-box {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border-radius: 12px;
          padding: 14px 16px;
          margin: 18px 0;
        }

        .policy-notice-box.notice-warning {
          background: ${isDark ? 'rgba(217,119,6,0.12)' : 'rgba(245,158,11,0.08)'};
          border: 1px solid rgba(217,119,6,0.25);
          color: ${isDark ? '#FDE68A' : '#78350F'};
        }

        .policy-checklist, .policy-bullet-list, .policy-ordered-list {
          font-size: 0.90rem;
          line-height: 1.7;
          color: ${isDark ? 'rgba(255,255,255,0.85)' : '#4A4035'};
          padding-left: 20px;
          margin: 0 0 20px;
        }

        .policy-checklist li, .policy-bullet-list li, .policy-ordered-list li {
          margin-bottom: 10px;
        }

        .policy-contact-card {
          margin-top: 32px;
          background: ${isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'};
          border: 1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(196,56,108,0.3)'};
          border-radius: 16px;
          padding: 24px;
        }

        .policy-contact-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(196,56,108,0.16)' : 'rgba(196,56,108,0.08)'};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .policy-contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .policy-contact-btn.btn-wa {
          background: #25D366;
          color: #FFFFFF;
        }

        .policy-contact-btn.btn-wa:hover {
          background: #20BA5A;
        }

        .policy-contact-btn.btn-mail {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          color: var(--text);
        }

        .policy-contact-btn.btn-mail:hover {
          background: var(--accent);
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
};

export default Policies;
