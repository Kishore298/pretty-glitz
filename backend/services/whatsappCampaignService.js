const https = require('https');

/**
 * WhatsApp Campaign Service
 * Integrates with Meta WhatsApp Cloud API via environment variables:
 * - WHATSAPP_ACCESS_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_API_VERSION (default: v21.0)
 *
 * If not configured, gracefully logs simulated dispatches without crashing.
 */
const sendWhatsAppMessage = async ({ to, message, imageUrl }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  // Sanitize phone number to standard international format (digits only, e.g. 919876543210)
  const cleanPhone = (to || '').replace(/\D/g, '');

  if (token && phoneId && cleanPhone) {
    return new Promise((resolve) => {
      let payload;
      if (imageUrl && imageUrl.trim()) {
        payload = JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'image',
          image: {
            link: imageUrl.trim(),
            caption: message,
          },
        });
      } else {
        payload = JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: message,
          },
        });
      }

      const options = {
        hostname: 'graph.facebook.com',
        port: 443,
        path: `/${apiVersion}/${phoneId}/messages`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
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
              resolve({
                success: true,
                messageId: parsed.messages?.[0]?.id || `wa-${Date.now()}`,
                simulated: false,
              });
            } else {
              resolve({
                success: false,
                error: parsed.error?.message || `HTTP ${res.statusCode}`,
                simulated: false,
              });
            }
          } catch {
            resolve({
              success: false,
              error: `Invalid JSON response (HTTP ${res.statusCode})`,
              simulated: false,
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
          simulated: false,
        });
      });

      req.write(payload);
      req.end();
    });
  }

  // Simulated fallback
  console.log(`[WhatsAppService - SIMULATED] To: ${cleanPhone || to} | Image: ${imageUrl || 'None'} | Message: ${message}`);
  return Promise.resolve({
    success: true,
    messageId: `simulated-wa-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    simulated: true,
  });
};

module.exports = {
  sendWhatsAppMessage,
};
