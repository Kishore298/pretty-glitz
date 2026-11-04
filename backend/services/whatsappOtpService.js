const https = require('https');

const isWhatsAppOtpEnabled = () => {
  return process.env.WHATSAPP_OTP_ENABLED === 'true';
};

/**
 * Dispatches a 6-digit OTP code to the customer's WhatsApp number.
 * When WHATSAPP_OTP_ENABLED is false or Meta credentials are not configured,
 * it runs in simulation mode, logging the OTP to the console.
 */
const sendWhatsAppOtp = async (mobile, otp) => {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const enabled = isWhatsAppOtpEnabled();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'prettyglitz_login_otp';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  // If feature flag is off or credentials are not yet configured, use safe simulation mode
  if (!enabled || !phoneNumberId || !accessToken) {
    console.log(
      `\x1b[36m[WhatsApp OTP Simulation]\x1b[0m OTP for +91${cleanMobile} is: \x1b[32m\x1b[1m${otp}\x1b[0m (Valid for 5 mins; WABA flag: ${enabled})`
    );
    return {
      success: true,
      simulated: true,
      message: 'OTP simulated successfully in development/pending mode.',
      // In non-production, return the OTP for developer ease
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  // Production Meta WhatsApp Business Cloud API Dispatch
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: `91${cleanMobile}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    });

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
            console.log(`[WhatsApp API] OTP sent to 91${cleanMobile}:`, parsed);
            resolve({ success: true, messageId: parsed.messages?.[0]?.id });
          } else {
            console.error('[WhatsApp API] Delivery error response:', parsed);
            reject(new Error(parsed.error?.message || 'Meta WhatsApp API returned an error.'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Meta API response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[WhatsApp API] Network error:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

module.exports = {
  isWhatsAppOtpEnabled,
  sendWhatsAppOtp,
};

