/**
 * whatsappOtpService.js
 *
 * Backward-compatibility wrapper delegating to the unified whatsappService.
 * Ensures all OTP, order, and notification messages contain proper support info.
 */
const whatsappService = require('./whatsappService');

module.exports = {
  isWhatsAppOtpEnabled: whatsappService.isWhatsAppConfigured,
  sendWhatsAppOtp: whatsappService.sendWhatsAppOtp,
  whatsappService,
};
