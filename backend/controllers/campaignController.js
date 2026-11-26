const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');
const Order = require('../models/Order');
const { sendEmail } = require('../services/emailService');
const { sendWhatsAppMessage } = require('../services/whatsappCampaignService');

const escapeAttr = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeHtmlText = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Builds the branded PrettyGlitz HTML email shell, always including
 * optional banner image, body content (HTML or plain text), and footer.
 */
const buildBrandedEmailHtml = ({ content, imageUrl, isTest = false }) => {
  const safeBanner = imageUrl && imageUrl.trim() ? escapeAttr(imageUrl.trim()) : '';
  const bodyBlock = content.includes('<')
    ? content
    : `<div style="white-space: pre-wrap;">${escapeHtmlText(content)}</div>`;

  return `<div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #f0e6e6; border-radius: 10px;">
    ${isTest ? '<p style="background: #fdf2f4; color: #c4386c; font-size: 12px; font-weight: bold; padding: 6px 12px; border-radius: 4px; display: inline-block; margin-top: 0;">[TEST PREVIEW]</p>' : ''}
    ${safeBanner ? `<img src="${safeBanner}" alt="PrettyGlitz Banner" style="width: 100%; max-height: 260px; object-fit: cover; border-radius: 8px; margin-bottom: 18px; display: block;" />` : ''}
    <div style="font-size: 15px; color: #2d2529;">${bodyBlock}</div>
    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 26px 0 14px;" />
    <p style="font-size: 11px; color: #888888; text-align: center; margin: 0;">
      You received this email because you subscribed to PrettyGlitz Collections VIP Circle.<br />
      &copy; ${new Date().getFullYear()} PrettyGlitz. All Rights Reserved.
    </p>
  </div>`;
};

/**
 * Collects unique customer WhatsApp-capable phone numbers (E.164 digits, defaulting 10-digit Indian numbers to 91 prefix)
 * from registered customer accounts and placed orders.
 */
const collectWhatsAppRecipients = async () => {
  const [users, orders] = await Promise.all([
    User.find({ role: 'customer', mobile: { $exists: true, $ne: null } }).select('mobile'),
    Order.find({ 'customer.mobile': { $exists: true, $ne: '' } }).select('customer.mobile'),
  ]);

  const phoneSet = new Set();
  const addNormalized = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return;
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
      phoneSet.add(`91${digits}`);
    } else if (digits.length >= 10 && digits.length <= 15) {
      phoneSet.add(digits);
    }
  };

  users.forEach((u) => addNormalized(u.mobile));
  orders.forEach((o) => addNormalized(o.customer?.mobile));
  return Array.from(phoneSet);
};

/**
 * @desc   Get all campaigns and overview metrics (Admin)
 * @route  GET /api/campaigns
 * @access Admin
 */
const getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, channel = '' } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};
    if (channel && (channel === 'EMAIL' || channel === 'WHATSAPP')) {
      query.channel = channel;
    }

    const skip = (safePage - 1) * safeLimit;
    const [filteredTotal, campaigns, totalEmail, totalWhatsApp, totalSent, waRecipients] = await Promise.all([
      Campaign.countDocuments(query),
      Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      Campaign.countDocuments({ channel: 'EMAIL' }),
      Campaign.countDocuments({ channel: 'WHATSAPP' }),
      Campaign.aggregate([{ $group: { _id: null, totalSentCount: { $sum: '$stats.sentCount' } } }]),
      collectWhatsAppRecipients(),
    ]);

    res.json({
      success: true,
      campaigns,
      pagination: {
        total: filteredTotal,
        page: safePage,
        pages: Math.max(1, Math.ceil(filteredTotal / safeLimit)),
        limit: safeLimit,
      },
      metrics: {
        totalCampaigns: totalEmail + totalWhatsApp,
        totalEmailCampaigns: totalEmail,
        totalWhatsAppCampaigns: totalWhatsApp,
        totalMessagesDelivered: totalSent[0]?.totalSentCount || 0,
        whatsappAudienceCount: waRecipients.length,
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving campaigns' });
  }
};

/**
 * @desc   Create and execute a new campaign (Admin)
 * @route  POST /api/campaigns
 * @access Admin
 */
const createAndSendCampaign = async (req, res) => {
  try {
    const { title, channel, subject, content, imageUrl, targetAudience = 'all_subscribers', customRecipients = [] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Campaign title is required' });
    }
    if (!channel || !['EMAIL', 'WHATSAPP'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Valid channel (EMAIL or WHATSAPP) is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Campaign content message is required' });
    }
    if (channel === 'EMAIL') {
      const strippedText = content.replace(/<[^>]*>/g, '').trim();
      const hasEmbeddedImage = /<img\s/i.test(content);
      if (!strippedText && !hasEmbeddedImage && !(imageUrl && imageUrl.trim())) {
        return res.status(400).json({ success: false, message: 'Email body cannot be empty' });
      }
      if (!subject || !subject.trim()) {
        return res.status(400).json({ success: false, message: 'Email subject is required for email campaigns' });
      }
    }

    let recipientList = [];

    if (targetAudience === 'custom') {
      if (Array.isArray(customRecipients)) {
        recipientList = Array.from(new Set(customRecipients.map((r) => String(r || '').trim()).filter(Boolean)));
      }
    } else if (channel === 'EMAIL') {
      const activeSubs = await Subscriber.find({ status: 'active' }).select('email');
      recipientList = activeSubs.map((s) => s.email);
    } else if (channel === 'WHATSAPP') {
      recipientList = await collectWhatsAppRecipients();
    }

    if (recipientList.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          channel === 'WHATSAPP'
            ? 'No customer phone numbers found. Add custom phone numbers or collect customer orders first.'
            : 'No active subscribers found to send this campaign to.',
      });
    }

    const campaign = new Campaign({
      title: title.trim(),
      channel,
      subject: (subject || '').trim(),
      content: content.trim(),
      imageUrl: (imageUrl || '').trim(),
      targetAudience,
      status: 'SENDING',
      stats: {
        totalRecipients: recipientList.length,
        sentCount: 0,
        failedCount: 0,
      },
      logs: [],
    });

    let sent = 0;
    let failed = 0;
    const logs = [];

    const emailHtml = channel === 'EMAIL'
      ? buildBrandedEmailHtml({ content: content.trim(), imageUrl, isTest: false })
      : '';
    const plainText = channel === 'EMAIL' ? content.replace(/<[^>]*>/g, '').trim() : '';

    for (const recipient of recipientList) {
      let dispatchResult;
      if (channel === 'EMAIL') {
        dispatchResult = await sendEmail({
          to: recipient,
          subject: subject.trim(),
          html: emailHtml,
          text: plainText,
        });
      } else {
        dispatchResult = await sendWhatsAppMessage({
          to: recipient,
          message: content.trim(),
          imageUrl: (imageUrl || '').trim(),
        });
      }

      if (dispatchResult.success) {
        sent += 1;
        logs.push({
          recipient,
          status: dispatchResult.simulated ? 'SIMULATED' : 'SENT',
          timestamp: new Date(),
        });
      } else {
        failed += 1;
        logs.push({
          recipient,
          status: 'FAILED',
          error: dispatchResult.error || 'Dispatch error',
          timestamp: new Date(),
        });
      }
    }

    campaign.stats.sentCount = sent;
    campaign.stats.failedCount = failed;
    campaign.logs = logs;
    campaign.status = failed === 0 ? 'SENT' : sent > 0 ? 'PARTIAL' : 'FAILED';
    campaign.sentAt = new Date();

    await campaign.save();

    res.status(201).json({
      success: true,
      message: `Campaign executed successfully. Sent: ${sent}, Failed: ${failed}.`,
      campaign,
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error creating campaign' });
  }
};

/**
 * @desc   Send a single test campaign message (Admin)
 * @route  POST /api/campaigns/test
 * @access Admin
 */
const testCampaign = async (req, res) => {
  try {
    const { channel, recipient, subject, content, imageUrl } = req.body;

    if (!channel || !['EMAIL', 'WHATSAPP'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Valid channel is required' });
    }
    if (!recipient || !recipient.trim()) {
      return res.status(400).json({ success: false, message: 'Test recipient is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let result;
    if (channel === 'EMAIL') {
      const emailHtml = buildBrandedEmailHtml({ content: content.trim(), imageUrl, isTest: true });
      result = await sendEmail({
        to: recipient.trim(),
        subject: `[TEST] ${subject || 'PrettyGlitz Campaign Preview'}`,
        html: emailHtml,
        text: content.replace(/<[^>]*>/g, '').trim(),
      });
    } else {
      result = await sendWhatsAppMessage({
        to: recipient.trim(),
        message: `[TEST PREVIEW]\n\n${content.trim()}`,
        imageUrl: (imageUrl || '').trim(),
      });
    }

    if (result.success) {
      return res.json({
        success: true,
        message: `Test ${channel} sent to ${recipient}! ${result.simulated ? '(Simulated Mode)' : ''}`,
        result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Failed to dispatch test: ${result.error}`,
      });
    }
  } catch (error) {
    console.error('Test campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error testing campaign' });
  }
};

module.exports = {
  getCampaigns,
  createAndSendCampaign,
  testCampaign,
};
