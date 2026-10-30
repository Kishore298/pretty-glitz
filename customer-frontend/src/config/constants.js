/**
 * PrettyGlitz — Centralized Brand & Contact Configuration
 * --------------------------------------------------------
 * All environment-driven configuration is located here.
 * UI components must import from this file rather than
 * hardcoding phone numbers or contact strings directly.
 */

// ---------------------------------------------------------------------------
// WhatsApp Configuration
// ---------------------------------------------------------------------------

const _rawNumber = (process.env.REACT_APP_WHATSAPP_NUMBER || '').trim().replace(/\D/g, '');

/**
 * True only when the env variable is set to a valid 10-15 digit phone number.
 * Never falls back to a placeholder so misconfiguration is visible at dev time.
 */
export const IS_WHATSAPP_CONFIGURED = _rawNumber.length >= 10 && _rawNumber.length <= 15;

/**
 * The validated E.164-style phone number (digits only), or null when unconfigured.
 */
export const WHATSAPP_NUMBER = IS_WHATSAPP_CONFIGURED ? _rawNumber : null;

export const WHATSAPP_DEFAULT_MESSAGE =
  'Hello PrettyGlitz, I would like to inquire about your jewellery collections.';

/**
 * Builds a WhatsApp deep-link URL for the current device.
 * Returns null and logs a dev warning when the number is not configured.
 *
 * @param {string} [text] - Optional pre-filled message text.
 * @returns {string|null}
 */
export const getWhatsAppUrl = (text = WHATSAPP_DEFAULT_MESSAGE) => {
  if (!IS_WHATSAPP_CONFIGURED || !WHATSAPP_NUMBER) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[PrettyGlitz] REACT_APP_WHATSAPP_NUMBER is not set or invalid. ' +
        'Set it in customer-frontend/.env to enable WhatsApp features.'
      );
    }
    return null;
  }

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const encoded = encodeURIComponent(text);
  return isMobile
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
};

// ---------------------------------------------------------------------------
// Brand Constants
// ---------------------------------------------------------------------------

export const BRAND_NAME = 'PrettyGlitz';
export const BRAND_EMAIL = 'hello@prettyglitz.com';
export const BRAND_INSTAGRAM = 'https://www.instagram.com/prettyglitz_collections?utm_source=ig_web_button_share_sheet&obrf=ZDNlZDc0MzIxNw==';

// ---------------------------------------------------------------------------
// LocalStorage Keys — centralised to avoid typo-driven storage mismatches
// ---------------------------------------------------------------------------

export const LS_CART_KEY = 'prettyglitz_cart';
export const LS_WISHLIST_KEY = 'prettyglitz_wishlist';
export const LS_CUSTOMER_TOKEN = 'customerToken';
export const LS_CUSTOMER_INFO = 'customerInfo';
