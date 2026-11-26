import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Mail,
  Users,
  History,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  Sparkles,
  Phone,
  CheckCheck,
  UserCheck,
  UserX,
  Info,
} from 'lucide-react';
import api from '../utils/api';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

/**
 * Safely renders basic WhatsApp formatting (*bold*, _italic_, ~strike~)
 * as React nodes without using dangerouslySetInnerHTML.
 */
const renderWhatsAppFormattedText = (text = '') => {
  const tokenRegex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  return text.split('\n').map((line, lineIdx) => (
    <React.Fragment key={lineIdx}>
      {lineIdx > 0 && <br />}
      {line.split(tokenRegex).map((part, partIdx) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <strong key={partIdx}>{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return <em key={partIdx}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
          return <del key={partIdx}>{part.slice(1, -1)}</del>;
        }
        return <React.Fragment key={partIdx}>{part}</React.Fragment>;
      })}
    </React.Fragment>
  ));
};

const Campaigns = () => {
  // Navigation tabs: 'compose' | 'subscribers' | 'history'
  const [activeTab, setActiveTab] = useState('compose');

  // Stats
  const [stats, setStats] = useState({
    subscribersTotal: 0,
    subscribersActive: 0,
    subscribersUnsubscribed: 0,
    campaignsTotal: 0,
    deliveredTotal: 0,
    whatsappAudienceCount: 0,
  });

  // Campaign Form State
  const [channel, setChannel] = useState('EMAIL'); // 'EMAIL' | 'WHATSAPP'
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [emailBodyHtml, setEmailBodyHtml] = useState(
    '<h2>Exclusive Festive Jewellery Offers ✨</h2><p>Dear VIP Customer,</p><p>Explore our latest handcrafted bangles and exclusive seasonal discounts curated just for you. Use code <strong>PRETTY10</strong> at checkout for 10% off your next order.</p><p><a href="https://prettyglitz.com">Shop the New Collection Now &rarr;</a></p>'
  );
  const [whatsappBody, setWhatsappBody] = useState(
    '✨ *PrettyGlitz Exclusive VIP Offer* ✨\n\nDear Customer,\nExplore our latest handcrafted bridal & silk thread bangles! 💖\n\n🛍️ *Special Discount*: Get flat ₹100 OFF on orders above ₹999.\nUse code: *FESTIVE100*\n\nTap below to browse our new collection:\nhttps://prettyglitz.com\n\nReply *YES* to chat with our styling concierge! 🌸'
  );
  const [targetAudience, setTargetAudience] = useState('all_subscribers');
  const [customRecipientsText, setCustomRecipientsText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Test send modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [appliedSubSearch, setAppliedSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [deleteSubTarget, setDeleteSubTarget] = useState(null);
  const [isDeletingSub, setIsDeletingSub] = useState(false);

  // History state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [historyChannelFilter, setHistoryChannelFilter] = useState('');
  const [selectedCampaignLogs, setSelectedCampaignLogs] = useState(null);

  // Editor ref & live latest HTML ref (prevents cursor reset while typing)
  const editorRef = useRef(null);
  const emailBodyHtmlRef = useRef(emailBodyHtml);
  emailBodyHtmlRef.current = emailBodyHtml;

  const fetchSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      const res = await api.get('/subscribers', {
        params: {
          page: subPage,
          limit: 15,
          search: appliedSubSearch,
          status: subStatusFilter,
        },
      });
      if (res.data?.success) {
        setSubscribers(res.data.subscribers || []);
        setSubTotalPages(res.data.pagination?.pages || 1);
        setStats((prev) => ({
          ...prev,
          subscribersTotal: res.data.counts?.total || 0,
          subscribersActive: res.data.counts?.active || 0,
          subscribersUnsubscribed: res.data.counts?.unsubscribed || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setSubscribersLoading(false);
    }
  }, [subPage, appliedSubSearch, subStatusFilter]);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await api.get('/campaigns', {
        params: { channel: historyChannelFilter },
      });
      if (res.data?.success) {
        setCampaigns(res.data.campaigns || []);
        setStats((prev) => ({
          ...prev,
          campaignsTotal: res.data.metrics?.totalCampaigns || 0,
          deliveredTotal: res.data.metrics?.totalMessagesDelivered || 0,
          whatsappAudienceCount: res.data.metrics?.whatsappAudienceCount || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setCampaignsLoading(false);
    }
  }, [historyChannelFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Populate contentEditable ONLY when switching onto EMAIL compose view
  useEffect(() => {
    if (activeTab === 'compose' && channel === 'EMAIL' && editorRef.current) {
      editorRef.current.innerHTML = emailBodyHtmlRef.current;
    }
  }, [activeTab, channel]);

  // Close open modals on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isTestModalOpen && !isSendingTest) setIsTestModalOpen(false);
        if (selectedCampaignLogs) setSelectedCampaignLogs(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTestModalOpen, isSendingTest, selectedCampaignLogs]);

  // Rich Text Editor Commands
  const executeCommand = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      setEmailBodyHtml(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter destination URL (e.g. https://prettyglitz.com):');
    if (url && /^https?:\/\//i.test(url.trim())) {
      executeCommand('createLink', url.trim());
    } else if (url) {
      toast.error('Please enter a valid URL starting with http:// or https://');
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter Image URL (https://...):');
    if (url && /^https?:\/\//i.test(url.trim())) {
      executeCommand('insertImage', url.trim());
    } else if (url) {
      toast.error('Please enter a valid image URL starting with http:// or https://');
    }
  };

  // WhatsApp quick format helper
  const insertWhatsAppSyntax = (prefix, suffix = '') => {
    setWhatsappBody((prev) => `${prev}${prefix}Text${suffix}`);
  };

  // Dispatch campaign
  const handleLaunchCampaign = async () => {
    if (!title.trim()) {
      toast.error('Please enter a campaign title.');
      return;
    }

    if (channel === 'EMAIL' && !subject.trim()) {
      toast.error('Please enter an email subject line.');
      return;
    }

    const content = channel === 'EMAIL' ? emailBodyHtml : whatsappBody;
    if (channel === 'EMAIL') {
      const stripped = content.replace(/<[^>]*>/g, '').trim();
      const hasEmbeddedImg = /<img\s/i.test(content);
      if (!stripped && !hasEmbeddedImg && !imageUrl.trim()) {
        toast.error('Please enter your email content before sending.');
        return;
      }
    } else if (!content || !content.trim()) {
      toast.error('Please enter your WhatsApp message content.');
      return;
    }

    let customList = [];
    if (targetAudience === 'custom') {
      customList = customRecipientsText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (customList.length === 0) {
        toast.error('Please enter at least one recipient for custom audience.');
        return;
      }
    }

    setIsSending(true);
    const toastId = toast.loading(`Dispatching ${channel} campaign...`);

    try {
      const res = await api.post('/campaigns', {
        title: title.trim(),
        channel,
        subject: subject.trim(),
        content,
        imageUrl: imageUrl.trim(),
        targetAudience,
        customRecipients: customList,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Campaign launched successfully!', { id: toastId });
        setTitle('');
        setSubject('');
        setImageUrl('');
        fetchCampaigns();
        setActiveTab('history');
      } else {
        toast.error(res.data?.message || 'Failed to dispatch campaign', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error while dispatching campaign.', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  // Send single test
  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast.error(`Please provide a test ${channel === 'EMAIL' ? 'email' : 'phone number'}.`);
      return;
    }

    const content = channel === 'EMAIL' ? emailBodyHtml : whatsappBody;
    if (!content || !content.trim()) {
      toast.error('Please compose your message before sending a test.');
      return;
    }

    setIsSendingTest(true);
    const toastId = toast.loading(`Sending test ${channel}...`);
    try {
      const res = await api.post('/campaigns/test', {
        channel,
        recipient: testRecipient.trim(),
        subject: subject.trim(),
        content,
        imageUrl: imageUrl.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Test sent successfully!', { id: toastId });
        setIsTestModalOpen(false);
      } else {
        toast.error(res.data?.message || 'Failed to send test', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch test message.', { id: toastId });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Toggle subscriber status
  const handleToggleSubStatus = async (sub) => {
    try {
      const res = await api.patch(`/subscribers/${sub._id}/status`);
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchSubscribers();
      }
    } catch {
      toast.error('Failed to update subscriber status');
    }
  };

  // Delete subscriber
  const handleDeleteSub = async () => {
    if (!deleteSubTarget) return;
    setIsDeletingSub(true);
    try {
      const res = await api.delete(`/subscribers/${deleteSubTarget._id}`);
      if (res.data?.success) {
        toast.success('Subscriber removed');
        setDeleteSubTarget(null);
        fetchSubscribers();
      }
    } catch {
      toast.error('Failed to delete subscriber');
    } finally {
      setIsDeletingSub(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Email & WhatsApp Campaign Manager"
        subtitle="Compose and broadcast promotional newsletters, VIP offers, and WhatsApp alerts to your subscribers."
      />

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="campaign-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(196, 56, 108, 0.16)', color: 'var(--accent)' }}>
            <Users size={20} />
          </div>
          <div>
            <span className="stat-label">Total Subscribers</span>
            <h3 className="stat-value">{stats.subscribersTotal}</h3>
            <span className="stat-subtext" style={{ color: '#10B981' }}>
              {stats.subscribersActive} Active Circle
            </span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.16)', color: '#3B82F6' }}>
            <Mail size={20} />
          </div>
          <div>
            <span className="stat-label">Email Dispatches</span>
            <h3 className="stat-value">{campaigns.filter((c) => c.channel === 'EMAIL').length}</h3>
            <span className="stat-subtext">HTML Newsletters</span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(37, 211, 102, 0.16)', color: '#25D366' }}>
            <Phone size={20} />
          </div>
          <div>
            <span className="stat-label">WhatsApp Contacts</span>
            <h3 className="stat-value">{stats.whatsappAudienceCount}</h3>
            <span className="stat-subtext">Registered & Order Phones</span>
          </div>
        </div>

        <div className="campaign-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(201, 168, 76, 0.16)', color: '#C9A84C' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <span className="stat-label">Total Delivered</span>
            <h3 className="stat-value">{stats.deliveredTotal}</h3>
            <span className="stat-subtext">{stats.campaignsTotal} Campaigns Sent</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          marginBottom: 24,
          paddingBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('compose')}
          className={`campaign-nav-tab ${activeTab === 'compose' ? 'is-active' : ''}`}
        >
          <Send size={16} />
          <span>New Campaign</span>
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`campaign-nav-tab ${activeTab === 'subscribers' ? 'is-active' : ''}`}
        >
          <Users size={16} />
          <span>Subscribers ({stats.subscribersActive})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`campaign-nav-tab ${activeTab === 'history' ? 'is-active' : ''}`}
        >
          <History size={16} />
          <span>Sent Campaigns ({stats.campaignsTotal})</span>
        </button>
      </div>

      {/* ── TAB 1: COMPOSE CAMPAIGN ── */}
      {activeTab === 'compose' && (
        <div className="campaign-compose-grid">
          {/* Left Column: Form & Editor */}
          <div className="campaign-panel">
            <h3 className="panel-title">1. Channel & Campaign Details</h3>

            {/* Channel Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`channel-pill-btn ${channel === 'EMAIL' ? 'active-email' : ''}`}
              >
                <Mail size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Email Campaign</div>
                  <div style={{ fontSize: '0.74rem', opacity: 0.7 }}>Rich-text HTML newsletter</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`channel-pill-btn ${channel === 'WHATSAPP' ? 'active-whatsapp' : ''}`}
              >
                <Phone size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>WhatsApp Campaign</div>
                  <div style={{ fontSize: '0.74rem', opacity: 0.7 }}>Direct messaging with preview</div>
                </div>
              </button>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Internal Campaign Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Diwali Bridal Bangle Launch & Secret Discount"
                className="form-input"
              />
            </div>

            {/* Email Subject Line (Conditional) */}
            {channel === 'EMAIL' && (
              <div className="form-group">
                <label className="form-label">Email Subject Line *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. ✨ Secret VIP Access: New Handcrafted Bangles + 10% OFF"
                  className="form-input"
                />
              </div>
            )}

            {/* Optional Banner Image URL */}
            <div className="form-group">
              <label className="form-label">Header Banner Image URL (Optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/... or paste image link"
                className="form-input"
              />
            </div>

            {/* ── Email Rich-Text Editor ── */}
            {channel === 'EMAIL' && (
              <div className="form-group">
                <label className="form-label">Email Content (Rich-Text Editor) *</label>

                {/* Editor Toolbar */}
                <div className="editor-toolbar">
                  <button
                    type="button"
                    onClick={() => executeCommand('bold')}
                    title="Bold (Ctrl+B)"
                    className="toolbar-btn"
                  >
                    <Bold size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('italic')}
                    title="Italic (Ctrl+I)"
                    className="toolbar-btn"
                  >
                    <Italic size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('underline')}
                    title="Underline (Ctrl+U)"
                    className="toolbar-btn"
                  >
                    <Underline size={15} />
                  </button>
                  <div className="toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => executeCommand('formatBlock', '<h1>')}
                    title="Heading 1"
                    className="toolbar-btn"
                  >
                    <Heading1 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('formatBlock', '<h2>')}
                    title="Heading 2"
                    className="toolbar-btn"
                  >
                    <Heading2 size={15} />
                  </button>
                  <div className="toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => executeCommand('insertUnorderedList')}
                    title="Bullet List"
                    className="toolbar-btn"
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('insertOrderedList')}
                    title="Numbered List"
                    className="toolbar-btn"
                  >
                    <ListOrdered size={15} />
                  </button>
                  <div className="toolbar-divider" />
                  <button
                    type="button"
                    onClick={handleInsertLink}
                    title="Insert Link"
                    className="toolbar-btn"
                  >
                    <LinkIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertImage}
                    title="Insert Image"
                    className="toolbar-btn"
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>

                {/* ContentEditable Container */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={(e) => setEmailBodyHtml(e.currentTarget.innerHTML)}
                  className="rich-editor-canvas"
                  style={{ minHeight: 180 }}
                />
              </div>
            )}

            {/* ── WhatsApp Message Composer ── */}
            {channel === 'WHATSAPP' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>WhatsApp Message Body *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => insertWhatsAppSyntax('*', '*')}
                      className="wa-syntax-btn"
                      title="Bold"
                    >
                      *bold*
                    </button>
                    <button
                      type="button"
                      onClick={() => insertWhatsAppSyntax('_', '_')}
                      className="wa-syntax-btn"
                      title="Italic"
                    >
                      _italic_
                    </button>
                    <button
                      type="button"
                      onClick={() => insertWhatsAppSyntax('~', '~')}
                      className="wa-syntax-btn"
                      title="Strikethrough"
                    >
                      ~strike~
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={whatsappBody}
                  onChange={(e) => setWhatsappBody(e.target.value)}
                  placeholder="Type your WhatsApp broadcast message..."
                  className="form-textarea"
                />
              </div>
            )}

            {/* Audience Target */}
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="form-select"
              >
                <option value="all_subscribers">
                  {channel === 'EMAIL'
                    ? `All Active Email Subscribers (${stats.subscribersActive} contacts)`
                    : `All Registered & Order Customers with Phone (${stats.whatsappAudienceCount} contacts)`}
                </option>
                <option value="custom">
                  Custom Recipient List ({channel === 'EMAIL' ? 'Paste emails' : 'Paste phone numbers'})
                </option>
              </select>
            </div>

            {targetAudience === 'custom' && (
              <div className="form-group">
                <label className="form-label">Custom Recipients (separated by comma or new line)</label>
                <textarea
                  rows={3}
                  value={customRecipientsText}
                  onChange={(e) => setCustomRecipientsText(e.target.value)}
                  placeholder={
                    channel === 'EMAIL'
                      ? 'vip1@gmail.com, customer2@yahoo.com'
                      : '916374727500, 917010737706'
                  }
                  className="form-textarea"
                />
              </div>
            )}

            {/* Dispatch Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(true)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                <Eye size={16} />
                <span>Send Test</span>
              </button>

              <button
                type="button"
                disabled={isSending}
                onClick={handleLaunchCampaign}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                <Send size={16} />
                <span>{isSending ? 'Launching Campaign...' : 'Launch Broadcast Campaign'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Device Preview */}
          <div className="campaign-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="panel-title">
              {channel === 'EMAIL' ? 'Live Email Preview' : 'Live WhatsApp Chat Preview'}
            </h3>

            {channel === 'EMAIL' ? (
              /* Email Client Mock */
              <div className="email-preview-frame">
                <div className="email-preview-header">
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#999' }}>
                    <strong>From:</strong> PrettyGlitz Collections &lt;prettyglitzcollections@gmail.com&gt;
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#999', marginTop: 2 }}>
                    <strong>Subject:</strong> {subject || '(No Subject Line)'}
                  </div>
                </div>

                <div className="email-preview-body">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      style={{
                        width: '100%',
                        maxHeight: 180,
                        objectFit: 'cover',
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div
                    dangerouslySetInnerHTML={{ __html: emailBodyHtml }}
                    style={{ fontSize: '0.88rem', lineHeight: 1.6 }}
                  />
                  <hr style={{ borderTop: '1px solid #eee', borderRight: 'none', borderBottom: 'none', borderLeft: 'none', margin: '24px 0 12px' }} />
                  <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', margin: 0 }}>
                    You received this email because you subscribed to PrettyGlitz Collections VIP Circle.
                  </p>
                </div>
              </div>
            ) : (
              /* WhatsApp Phone Mock */
              <div className="wa-preview-phone">
                {/* Phone Header */}
                <div className="wa-phone-topbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="wa-avatar">PG</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>PrettyGlitz Official</div>
                      <div style={{ fontSize: '0.70rem', color: 'rgba(255,255,255,0.7)' }}>Verified Business</div>
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="wa-chat-canvas">
                  <div className="wa-chat-bubble">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="WhatsApp Media"
                        style={{
                          width: '100%',
                          borderRadius: 8,
                          marginBottom: 8,
                          maxHeight: 160,
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div style={{ wordBreak: 'break-word', fontSize: '0.85rem', lineHeight: 1.45 }}>
                      {renderWhatsAppFormattedText(whatsappBody)}
                    </div>
                    <div className="wa-bubble-footer">
                      <span>12:00 PM</span>
                      <CheckCheck size={14} color="#53bdeb" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SUBSCRIBERS LIST ── */}
      {activeTab === 'subscribers' && (
        <div className="campaign-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="text"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSubPage(1);
                      setAppliedSubSearch(subSearch);
                    }
                  }}
                  placeholder="Search subscriber email & press Enter..."
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
              <select
                value={subStatusFilter}
                onChange={(e) => {
                  setSubPage(1);
                  setSubStatusFilter(e.target.value);
                }}
                className="form-select"
                style={{ width: 150 }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSubPage(1);
                setAppliedSubSearch(subSearch);
                fetchSubscribers();
              }}
              className="btn-secondary"
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={14} />
              <span>Search / Refresh</span>
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subscriber Email</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribersLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 30, opacity: 0.6 }}>
                      Loading subscribers...
                    </td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 30, opacity: 0.6 }}>
                      No subscribers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub._id}>
                      <td style={{ fontWeight: 600 }}>{sub.email}</td>
                      <td>
                        <span className={`status-badge ${sub.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                          {sub.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}
                          <span>{sub.status}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: '0.80rem', opacity: 0.8 }}>
                        {sub.source || 'Website'}
                      </td>
                      <td style={{ fontSize: '0.80rem', opacity: 0.8 }}>
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => handleToggleSubStatus(sub)}
                            className="action-icon-btn"
                            title={sub.status === 'active' ? 'Mark Unsubscribed' : 'Reactivate'}
                          >
                            {sub.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button
                            onClick={() => setDeleteSubTarget(sub)}
                            className="action-icon-btn btn-delete"
                            title="Delete Subscriber"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {subTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                disabled={subPage <= 1}
                onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.80rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                Page {subPage} of {subTotalPages}
              </span>
              <button
                type="button"
                disabled={subPage >= subTotalPages}
                onClick={() => setSubPage((p) => Math.min(subTotalPages, p + 1))}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.80rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: CAMPAIGN HISTORY ── */}
      {activeTab === 'history' && (
        <div className="campaign-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="panel-title" style={{ margin: 0 }}>Sent Campaign History</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={historyChannelFilter}
                onChange={(e) => setHistoryChannelFilter(e.target.value)}
                className="form-select"
                style={{ width: 150 }}
              >
                <option value="">All Channels</option>
                <option value="EMAIL">Email Only</option>
                <option value="WHATSAPP">WhatsApp Only</option>
              </select>
              <button onClick={fetchCampaigns} className="btn-secondary" style={{ padding: '8px 14px' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign Title & Channel</th>
                  <th>Subject / Preview</th>
                  <th>Status</th>
                  <th>Sent / Failed</th>
                  <th>Sent At</th>
                  <th style={{ textAlign: 'right' }}>Logs</th>
                </tr>
              </thead>
              <tbody>
                {campaignsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 30, opacity: 0.6 }}>
                      Loading campaigns...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 30, opacity: 0.6 }}>
                      No campaigns dispatched yet. Create your first campaign above!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp._id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{camp.title}</div>
                        <span className={`channel-badge ${camp.channel === 'EMAIL' ? 'badge-email' : 'badge-wa'}`}>
                          {camp.channel === 'EMAIL' ? <Mail size={11} /> : <Phone size={11} />}
                          <span>{camp.channel}</span>
                        </span>
                      </td>
                      <td style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {camp.subject || camp.content.replace(/<[^>]*>/g, '').slice(0, 45)}
                      </td>
                      <td>
                        <span className={`status-badge badge-${camp.status.toLowerCase()}`}>
                          {camp.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>{camp.stats?.sentCount || 0}</span>
                        {' / '}
                        <span style={{ color: '#EF4444', fontWeight: 600 }}>{camp.stats?.failedCount || 0}</span>
                        <div style={{ fontSize: '0.70rem', opacity: 0.7 }}>
                          Total: {camp.stats?.totalRecipients || 0}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.80rem', opacity: 0.8 }}>
                        {new Date(camp.sentAt || camp.createdAt).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedCampaignLogs(camp)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Info size={13} />
                          <span>Logs</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Test Send Modal ── */}
      {isTestModalOpen && (
        <div
          className="campaign-modal-overlay"
          onClick={() => {
            if (!isSendingTest) setIsTestModalOpen(false);
          }}
        >
          <div className="campaign-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
              Send Test {channel === 'EMAIL' ? 'Email' : 'WhatsApp'} Message
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 16px' }}>
              Send an instant preview to your personal inbox or phone before launching to all subscribers.
            </p>

            <div className="form-group">
              <label className="form-label">
                Test Recipient {channel === 'EMAIL' ? '(Email Address)' : '(Phone number with country code, e.g. 919876543210)'}
              </label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={channel === 'EMAIL' ? 'your-email@example.com' : '916374727500'}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                disabled={isSendingTest}
                onClick={() => setIsTestModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingTest}
                onClick={handleSendTest}
                className="btn-primary"
              >
                {isSendingTest ? 'Sending...' : 'Send Test Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Campaign Logs Modal ── */}
      {selectedCampaignLogs && (
        <div
          className="campaign-modal-overlay"
          onClick={() => setSelectedCampaignLogs(null)}
        >
          <div className="campaign-modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                Delivery Logs: {selectedCampaignLogs.title}
              </h3>
              <button
                onClick={() => setSelectedCampaignLogs(null)}
                className="action-icon-btn"
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {selectedCampaignLogs.logs && selectedCampaignLogs.logs.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Status</th>
                      <th>Details / Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCampaignLogs.logs.map((log, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.85rem' }}>{log.recipient}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              log.status === 'SENT'
                                ? 'badge-sent'
                                : log.status === 'SIMULATED'
                                ? 'badge-simulated'
                                : 'badge-failed'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                          {log.error ? <span style={{ color: '#FCA5A5' }}>{log.error} · </span> : null}
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                  No granular recipient logs recorded for this campaign.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Subscriber Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteSubTarget)}
        title="Remove Subscriber"
        message="Are you sure you want to remove this subscriber? They will no longer receive campaigns."
        itemName={deleteSubTarget?.email}
        confirmText="Remove"
        loading={isDeletingSub}
        onConfirm={handleDeleteSub}
        onClose={() => {
          if (!isDeletingSub) setDeleteSubTarget(null);
        }}
      />

      <style>{`
        .campaign-compose-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr);
          gap: 24px;
        }

        @media (max-width: 960px) {
          .campaign-compose-grid {
            grid-template-columns: 1fr;
          }
        }

        .campaign-stat-card {
          background: var(--card-bg, #14131D);
          border: 1px solid var(--card-border, rgba(201, 168, 76, 0.12));
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          display: block;
        }

        .stat-value {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text, #FFF);
          margin: 2px 0;
        }

        .stat-subtext {
          font-size: 0.72rem;
          opacity: 0.8;
          display: block;
        }

        .campaign-nav-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.90rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .campaign-nav-tab.is-active {
          color: #FFF;
          background: var(--accent, #C4386C);
        }

        .campaign-panel {
          background: var(--card-bg, #14131D);
          border: 1px solid var(--card-border, rgba(201, 168, 76, 0.12));
          border-radius: 16px;
          padding: 24px;
        }

        .panel-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text, #FFF);
          margin: 0 0 18px;
        }

        .channel-pill-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .channel-pill-btn.active-email {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3B82F6;
          color: #93C5FD;
        }

        .channel-pill-btn.active-whatsapp {
          background: rgba(37, 211, 102, 0.15);
          border-color: #25D366;
          color: #86EFAC;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 6px;
        }

        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #FFF;
          font-size: 0.88rem;
          box-sizing: border-box;
          outline: none;
        }

        .form-select option {
          background: #14131D;
          color: #FFFFFF;
        }

        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: var(--accent, #C4386C);
        }

        .editor-toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          flex-wrap: wrap;
        }

        .toolbar-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFF;
        }

        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.15);
          margin: 0 4px;
        }

        .rich-editor-canvas {
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0 0 10px 10px;
          color: #FFF;
          outline: none;
          overflow-y: auto;
          font-size: 0.90rem;
          line-height: 1.6;
        }

        .rich-editor-canvas:focus {
          border-color: var(--accent, #C4386C);
        }

        .wa-syntax-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.72rem;
          padding: 2px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2));
          border: none;
          border-radius: 10px;
          color: #FFF;
          font-weight: 700;
          font-size: 0.90rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(196, 56, 108, 0.35);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: #FFF;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Email Preview Mock */
        .email-preview-frame {
          background: #FFFFFF;
          color: #222;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
          border: 1px solid #E5E7EB;
        }

        .email-preview-header {
          background: #F3F4F6;
          padding: 12px 16px;
          border-bottom: 1px solid #E5E7EB;
        }

        .email-preview-body {
          padding: 20px;
          min-height: 300px;
        }

        /* WhatsApp Preview Mock */
        .wa-preview-phone {
          background: #0B141A;
          border-radius: 24px;
          overflow: hidden;
          border: 4px solid #1F2C34;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
        }

        .wa-phone-topbar {
          background: #202C33;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .wa-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent, #C4386C);
          color: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .wa-chat-canvas {
          padding: 20px 14px;
          background-color: #0B141A;
          background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 16px 16px;
          min-height: 340px;
        }

        .wa-chat-bubble {
          background: #005C4B;
          color: #E9EDEF;
          padding: 10px 12px 6px;
          border-radius: 12px 12px 2px 12px;
          max-width: 90%;
          margin-left: auto;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .wa-bubble-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
        }

        /* Tables */
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .admin-table th {
          text-align: left;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
        }

        .admin-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--text, #FFF);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-active, .badge-sent {
          background: rgba(16, 185, 129, 0.16);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-inactive, .badge-failed {
          background: rgba(239, 68, 68, 0.16);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-partial, .badge-simulated {
          background: rgba(245, 158, 11, 0.16);
          color: #FBBF24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .badge-sending, .badge-draft {
          background: rgba(59, 130, 246, 0.16);
          color: #60A5FA;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .channel-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 0.68rem;
          font-weight: 700;
          margin-top: 4px;
        }

        .badge-email {
          background: rgba(59, 130, 246, 0.15);
          color: #93C5FD;
        }

        .badge-wa {
          background: rgba(37, 211, 102, 0.15);
          color: #86EFAC;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .action-icon-btn.btn-delete:hover {
          background: #EF4444;
          color: #FFF;
          border-color: #EF4444;
        }

        /* Modal */
        .campaign-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .campaign-modal-box {
          background: var(--card-bg, #14131D);
          border: 1px solid var(--card-border, rgba(201, 168, 76, 0.2));
          border-radius: 18px;
          padding: 24px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </PageWrapper>
  );
};

export default Campaigns;
