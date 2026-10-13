/**
 * Atelier WhatsApp Customer Care Utility
 * Strictly avoids exposing internal secrets, credit card data, or passwords.
 * Sanitizes phone numbers into international format and URI encodes inquiry templates.
 */

export const getWhatsAppNumber = () => {
  const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
  // Strip non-digits
  return rawNumber.replace(/\D/g, '');
};

export const getFormattedWhatsAppNumber = () => {
  const num = getWhatsAppNumber();
  if (num.startsWith('91') && num.length === 12) {
    return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
  }
  return `+${num}`;
};

/**
 * Generate context-aware prefilled inquiry message
 * @param {string} topic - 'sizing' | 'availability' | 'order' | 'pod_artwork' | 'shipping' | 'general'
 * @param {object} details - contextual payload
 */
export const buildWhatsAppMessage = (topic, details = {}) => {
  const brand = 'BLANC ATELIER';

  switch (topic) {
    case 'sizing': {
      const { productName, chest, fitPreference } = details;
      let msg = `Hello ${brand}, I would like guidance on choosing the right size`;
      if (productName) msg += ` for the "${productName}"`;
      if (chest) msg += `. My chest measurement is approx ${chest}`;
      if (fitPreference) msg += ` and I prefer a ${fitPreference} fit`;
      msg += `. Could you recommend the best size?`;
      return msg;
    }

    case 'availability': {
      const { productName, size, color } = details;
      let msg = `Hi ${brand}, I am checking availability`;
      if (productName) msg += ` for "${productName}"`;
      if (size) msg += ` in Size ${size}`;
      if (color) msg += ` (${color})`;
      msg += `. When will more units be ready?`;
      return msg;
    }

    case 'order': {
      const { orderNumber, email } = details;
      let msg = `Hello ${brand} Concierge, I have an inquiry regarding my order`;
      if (orderNumber) msg += ` #${orderNumber}`;
      if (email) msg += ` (registered under ${email})`;
      msg += `. Could you please share the current status?`;
      return msg;
    }

    case 'pod_artwork': {
      const { designId, dpi, fabricGsm } = details;
      let msg = `Hi ${brand} Studio, I have a custom print-on-demand artwork question`;
      if (designId) msg += ` for Design ID: ${designId}`;
      if (dpi) msg += ` (Resolution: ${dpi} DPI)`;
      msg += `. Can your pre-press team verify print sharpness?`;
      return msg;
    }

    case 'shipping': {
      const { pincode } = details;
      let msg = `Hello ${brand}, could you confirm estimated delivery times and Express shipping`;
      if (pincode) msg += ` to PIN code ${pincode}`;
      msg += `?`;
      return msg;
    }

    case 'general':
    default: {
      return `Hello ${brand}, I am browsing your minimal t-shirt atelier and would love some assistance with an order.`;
    }
  }
};

/**
 * Generate full wa.me link
 */
export const createWhatsAppUrl = (topic = 'general', details = {}) => {
  const phone = getWhatsAppNumber();
  const text = buildWhatsAppMessage(topic, details);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};
