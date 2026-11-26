const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedConfigKey = null;

/**
 * Build or reuse a cached nodemailer transporter from environment variables.
 * If credentials are not supplied, falls back to a safe simulated mode
 * so campaign dispatch does not crash during development or demos.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const key = `${host}:${port}:${user}`;
    if (!cachedTransporter || cachedConfigKey !== key) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      cachedConfigKey = key;
    }
    return cachedTransporter;
  }

  return null;
};

/**
 * Send an email campaign or single test email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"PrettyGlitz Collections" <prettyglitzcollections@gmail.com>';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: html || text,
        text: text || undefined,
      });
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message, simulated: false };
    }
  } else {
    // Simulated delivery for local dev / demo when SMTP is not configured
    console.log(`[EmailService - SIMULATED] From: ${from} | To: ${to} | Subject: ${subject}`);
    return {
      success: true,
      messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      simulated: true,
    };
  }
};

module.exports = {
  sendEmail,
};
