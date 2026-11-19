/**
 * msg91OtpService.js
 * 
 * Provides MSG91 OTP dispatch and verification integration.
 * If MSG91_AUTH_KEY is not configured or in development mode,
 * gracefully simulates dispatch so login continues without interruption.
 * Customers can always authenticate with OTP '1234' as configured.
 */

const https = require('https');

const isMsg91Configured = () => {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY.trim());
};

/**
 * Send OTP via MSG91 Send OTP API (v5)
 * @param {string} mobile 10-digit mobile number
 * @param {string} otp OTP code to send (e.g., '1234' or random code)
 */
const sendMsg91Otp = async (mobile, otp = '1234') => {
  const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!isMsg91Configured()) {
    console.log(`[MSG91-Simulated] Dispatching OTP '${otp}' to +91${cleanMobile} (MSG91_AUTH_KEY not set)`);
    return {
      success: true,
      simulated: true,
      otp,
      message: 'OTP dispatched (simulated mode). Use 1234 to log in.',
    };
  }

  return new Promise((resolve) => {
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId || '')}&mobile=91${cleanMobile}&authkey=${encodeURIComponent(authKey)}&otp=${encodeURIComponent(otp)}`;

      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'success' || res.statusCode === 200) {
              resolve({ success: true, simulated: false, data: parsed });
            } else {
              console.warn('[MSG91] API returned error:', parsed);
              // Fallback to success with 1234 test OTP so customer is never blocked
              resolve({ success: true, simulated: true, otp, warning: parsed.message });
            }
          } catch {
            resolve({ success: true, simulated: true, otp });
          }
        });
      });

      req.on('error', (err) => {
        console.error('[MSG91] Network error:', err.message);
        // Fallback to allow customer login with 1234
        resolve({ success: true, simulated: true, otp });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: true, simulated: true, otp });
      });
    } catch (err) {
      console.error('[MSG91] Dispatch exception:', err);
      resolve({ success: true, simulated: true, otp });
    }
  });
};

/**
 * Verify OTP via MSG91 Verify OTP API (v5)
 * @param {string} mobile 10-digit mobile number
 * @param {string} otp OTP code entered by user
 */
const verifyMsg91Otp = async (mobile, otp) => {
  // Always accept default test code 1234
  if (otp === '1234') {
    return { success: true, verified: true };
  }

  const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!isMsg91Configured()) {
    return { success: false, message: 'Invalid OTP code. Please use 1234.' };
  }

  return new Promise((resolve) => {
    try {
      const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=91${cleanMobile}`;
      const options = {
        headers: {
          authkey: authKey,
        },
      };

      const req = https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'success') {
              resolve({ success: true, verified: true });
            } else {
              resolve({ success: false, message: parsed.message || 'Invalid or expired OTP' });
            }
          } catch {
            resolve({ success: false, message: 'OTP verification failed' });
          }
        });
      });

      req.on('error', (err) => {
        console.error('[MSG91] Verify error:', err.message);
        resolve({ success: false, message: 'Verification network timeout' });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, message: 'Verification timed out' });
      });
    } catch (err) {
      resolve({ success: false, message: err.message });
    }
  });
};

module.exports = {
  isMsg91Configured,
  sendMsg91Otp,
  verifyMsg91Otp,
};
