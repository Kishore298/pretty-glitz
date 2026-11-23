const https = require('https');

/**
 * Retrieves the business WhatsApp number configured in the environment,
 * falling back to the official PrettyGlitz support number.
 */
const getBusinessWhatsAppNumber = () => {
  return (
    process.env.BUSINESS_WHATSAPP_NUMBER ||
    process.env.WHATSAPP_NUMBER ||
    process.env.REACT_APP_WHATSAPP_NUMBER ||
    '+91 70107 37706'
  ).trim();
};

/**
 * Appends standard support contact information to any WhatsApp message string.
 * Ensures the support line is always present exactly once.
 */
const appendSupportInfo = (messageText) => {
  const businessNumber = getBusinessWhatsAppNumber();
  const supportLine = `For support, contact: ${businessNumber}`;
  if (!messageText || typeof messageText !== 'string') return supportLine;
  if (messageText.includes('For support, contact:')) return messageText;
  return `${messageText.trim()}\n\n${supportLine}`;
};

/**
 * Checks whether Meta WhatsApp Cloud API credentials are fully configured.
 */
const isWhatsAppConfigured = () => {
  return (
    process.env.WHATSAPP_OTP_ENABLED === 'true' ||
    Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN)
  );
};

/**
 * Formats a WhatsApp deep-link URL (wa.me) for instant browser or mobile chat.
 */
const generateWhatsAppDeepLink = (mobile, messageText = '') => {
  const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
  const formattedText = appendSupportInfo(messageText);
  return `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(formattedText)}`;
};

/**
 * Low-level dispatch to Meta WhatsApp Cloud API or safe development simulation.
 */
const dispatchWhatsApp = async ({ to, text, template = null }) => {
  const cleanMobile = String(to || '').replace(/\D/g, '').slice(-10);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  const fullText = appendSupportInfo(text);

  // If Meta Cloud API is unconfigured, run in safe simulation mode
  if (!phoneNumberId || !accessToken) {
    console.log(
      `\x1b[36m[WhatsApp Cloud API Simulation]\x1b[0m To: \x1b[32m+91${cleanMobile}\x1b[0m\n` +
      `-----------------------------------------\n` +
      `${fullText}\n` +
      `-----------------------------------------`
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      to: cleanMobile,
      text: fullText,
    };
  }

  // Meta Cloud API HTTP dispatch
  return new Promise((resolve, reject) => {
    let postData;
    if (template) {
      postData = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: `91${cleanMobile}`,
        type: 'template',
        template,
      });
    } else {
      postData = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: `91${cleanMobile}`,
        type: 'text',
        text: {
          preview_url: false,
          body: fullText,
        },
      });
    }

    const options = {
      hostname: 'graph.facebook.com',
      path: `/${apiVersion}/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[WhatsApp Cloud API] Message dispatched to 91${cleanMobile}:`, parsed.messages?.[0]?.id);
            resolve({
              success: true,
              simulated: false,
              messageId: parsed.messages?.[0]?.id,
            });
          } else {
            console.warn('[WhatsApp Cloud API] Meta API response error:', parsed);
            reject(new Error(parsed.error?.message || `Meta API HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Meta API response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[WhatsApp Cloud API] Network error:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

/**
 * 1. OTP Verification Message
 */
const sendWhatsAppOtp = async (mobile, otp) => {
  const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
  const otpMessage = `Your PrettyGlitz verification code is: ${otp}. Valid for 5 minutes. Please do not share this code with anyone.`;
  return await dispatchWhatsApp({ to: cleanMobile, text: otpMessage });
};

/**
 * 2. Order Confirmation Message (including invoice details)
 */
const sendOrderConfirmation = async (order) => {
  if (!order || !order.customer?.mobile) {
    throw new Error('Order customer mobile is missing');
  }

  const itemsList = (order.items || [])
    .map((item) => {
      const details = [];
      if (item.size) details.push(`Size: ${item.size}`);
      if (item.colorName) details.push(`Colour: ${item.colorName}`);
      const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';
      return `• ${item.name}${detailStr} x ${item.quantity} — ₹${item.price * item.quantity}`;
    })
    .join('\n');

  const text =
    `✨ PrettyGlitz Order Confirmation ✨\n\n` +
    `Dear ${order.customer?.name || 'Customer'},\n` +
    `Thank you for your order! We have received your order request and our atelier is preparing it with utmost care.\n\n` +
    `📦 Order Details:\n` +
    `• Order ID: #${order.orderId}\n` +
    `• Total Amount: ₹${order.totalAmount}\n` +
    `• Order Status: Confirmed\n\n` +
    `💎 Items Ordered:\n` +
    `${itemsList || '• Handcrafted Jewellery Piece'}\n\n` +
    `📍 Delivery Address:\n` +
    `${order.customer?.address || ''}${order.customer?.city ? `, ${order.customer.city}` : ''}${order.customer?.pincode ? ` - ${order.customer.pincode}` : ''}\n\n` +
    `🔗 Track your order anytime:\n` +
    `https://prettyglitz.com/track-order?id=${order.orderId}`;

  return await dispatchWhatsApp({ to: order.customer.mobile, text });
};

/**
 * 3. Order Status Update Message
 */
const sendOrderStatusUpdate = async (order, newStatus, details = {}) => {
  if (!order || !order.customer?.mobile) {
    throw new Error('Order customer mobile is missing');
  }

  const status = newStatus || order.status;
  const courier = details.courierPartner || order.courierPartner || 'ST Courier';
  const trackingId = details.trackingId || order.trackingId || '';

  let statusDescription = `Your order status has been updated to: ${status}.`;
  if (status === 'CONFIRMED') {
    statusDescription = 'Your order is confirmed and our artisans are preparing your handcrafted jewellery with care.';
  } else if (status === 'PROCESSING') {
    statusDescription = 'Your order is currently being handcrafted, polished, and packaged in our atelier.';
  } else if (status === 'DISPATCHED') {
    statusDescription = `Your parcel has been dispatched via ${courier}!${trackingId ? ` Tracking ID: ${trackingId}.` : ''}`;
  } else if (status === 'DELIVERED') {
    statusDescription = 'Your parcel has been delivered! We hope you love your sparkling PrettyGlitz jewellery.';
  } else if (status === 'CANCELLED') {
    statusDescription = 'Your order has been cancelled. If you have questions or need assistance, please contact us.';
  }

  const text =
    `📦 PrettyGlitz Order Update 📦\n\n` +
    `Dear ${order.customer?.name || 'Customer'},\n\n` +
    `• Order ID: #${order.orderId}\n` +
    `• Status: ${status}\n` +
    `${trackingId ? `• Tracking ID: ${trackingId} (${courier})\n` : ''}` +
    `\n${statusDescription}\n\n` +
    `🔗 Live Tracking: https://prettyglitz.com/track-order?id=${order.orderId}`;

  return await dispatchWhatsApp({ to: order.customer.mobile, text });
};

/**
 * 4. Custom Customer Offer Message
 */
const sendCustomOffer = async ({ phone, customerName, offerText }) => {
  if (!phone) {
    throw new Error('Customer phone number is required');
  }
  if (!offerText || !offerText.trim()) {
    throw new Error('Offer message text cannot be empty');
  }

  const cleanMobile = String(phone).replace(/\D/g, '').slice(-10);
  const greeting = customerName ? `Dear ${customerName},\n\n` : '';
  const messageBody = `✨ PrettyGlitz Special Offer ✨\n\n${greeting}${offerText.trim()}`;

  return await dispatchWhatsApp({ to: cleanMobile, text: messageBody });
};

module.exports = {
  getBusinessWhatsAppNumber,
  appendSupportInfo,
  isWhatsAppConfigured,
  generateWhatsAppDeepLink,
  dispatchWhatsApp,
  sendWhatsAppOtp,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendCustomOffer,
};
