const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.host = process.env.SMTP_HOST;
    this.port = parseInt(process.env.SMTP_PORT || '587', 10);
    this.secure = process.env.SMTP_SECURE === 'true' || this.port === 465;
    this.user = process.env.SMTP_USER;
    this.pass = process.env.SMTP_PASS;
    this.fromName = process.env.SMTP_FROM_NAME || 'BLANC ATELIER';
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'support@blancatelier.com';

    this.isConfigured = !!(this.host && this.user && this.pass);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
    } else {
      this.transporter = null;
    }
  }

  get senderAddress() {
    return `"${this.fromName}" <${this.fromEmail}>`;
  }

  getBaseHtmlTemplate({ title, preheader, contentHtml }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 580px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E5E5E0; border-radius: 4px; overflow: hidden; }
    .header { padding: 36px 40px 24px; border-bottom: 1px solid #F0F0EC; text-align: center; }
    .brand-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #111111; }
    .brand-tagline { margin: 6px 0 0; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #737373; }
    .content { padding: 36px 40px; }
    .heading { margin: 0 0 16px; font-size: 22px; font-weight: 600; line-height: 1.3; color: #111111; }
    .paragraph { margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #404040; }
    .otp-box { margin: 28px 0; padding: 24px; background-color: #F8F8F6; border: 1px dashed #D4D4D0; text-align: center; border-radius: 4px; }
    .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.25em; color: #000000; margin: 0; }
    .otp-meta { margin: 10px 0 0; font-size: 12px; color: #737373; }
    .security-callout { margin: 24px 0 0; padding: 14px 18px; background-color: #FFFBEB; border-left: 3px solid #D97706; font-size: 12px; line-height: 1.5; color: #92400E; }
    .footer { padding: 24px 40px; background-color: #F8F8F6; border-top: 1px solid #E5E5E0; text-align: center; font-size: 11px; color: #737373; line-height: 1.5; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #111111; color: #FFFFFF !important; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">BLANC ATELIER</h1>
      <p class="brand-tagline">Minimalist Heavyweight T-Shirts & Custom POD Studio</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} BLANC ATELIER India. All rights reserved.</p>
      <p style="margin: 0;">Designed for discerning creators. Need help? Reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  async sendMail({ to, subject, html, text }) {
    if (!this.isConfigured || !this.transporter) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[EmailService] SMTP not fully configured. Email skipped for: ${to} | Subject: "${subject}"`);
      }
      return {
        success: false,
        skipped: true,
        message: 'SMTP credentials not configured in environment variables.'
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.senderAddress,
        to,
        subject,
        text,
        html
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 1. Signup Verification OTP
   */
  async sendSignupOtp({ email, name, otp, expiryMinutes = 5 }) {
    const subject = `${otp} is your BLANC ATELIER verification code`;
    const contentHtml = `
      <h2 class="heading">Verify Your Email Address</h2>
      <p class="paragraph">Hello ${name ? name.split(' ')[0] : 'there'},</p>
      <p class="paragraph">Thank you for registering with BLANC ATELIER. Enter the six-digit verification code below to verify your email and activate your account.</p>
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
        <p class="otp-meta">This code will expire in ${expiryMinutes} minutes</p>
      </div>
      <div class="security-callout">
        <strong>Security Warning:</strong> Never share this code with anyone, including BLANC ATELIER staff. We will never ask for your verification code over phone or WhatsApp.
      </div>
    `;
    const text = `BLANC ATELIER Email Verification\n\nYour 6-digit verification code is: ${otp}\nThis code will expire in ${expiryMinutes} minutes.\n\nDo not share this code with anyone.`;
    const html = this.getBaseHtmlTemplate({
      title: 'Verify Your Email Address',
      preheader: `Your verification code is ${otp}`,
      contentHtml
    });

    return await this.sendMail({ to: email, subject, html, text });
  }

  /**
   * 2. Forgot Password Reset OTP
   */
  async sendForgotPasswordOtp({ email, otp, expiryMinutes = 5 }) {
    const subject = `${otp} is your password reset code`;
    const contentHtml = `
      <h2 class="heading">Password Reset Request</h2>
      <p class="paragraph">We received a request to reset the password associated with this email address.</p>
      <p class="paragraph">Use the one-time code below to proceed with setting a new password:</p>
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
        <p class="otp-meta">Valid for ${expiryMinutes} minutes only</p>
      </div>
      <div class="security-callout">
        <strong>Important:</strong> If you did not initiate this request, you can safely ignore this email. Your account remains completely secure.
      </div>
    `;
    const text = `BLANC ATELIER Password Reset\n\nYour reset verification code is: ${otp}\nThis code will expire in ${expiryMinutes} minutes.\n\nIf you did not request this, please ignore this email.`;
    const html = this.getBaseHtmlTemplate({
      title: 'Reset Your Password',
      preheader: `Your password reset code is ${otp}`,
      contentHtml
    });

    return await this.sendMail({ to: email, subject, html, text });
  }

  /**
   * 3. Confirmed Order Notification (handles COD vs Prepaid appropriately)
   */
  async sendOrderConfirmation({ order }) {
    const isCod = order.paymentMethod === 'COD';
    const subject = `Order Confirmed: #${order.orderNumber} — BLANC ATELIER`;
    const totalRupees = (order.pricing.totalAmountPaise / 100).toFixed(2);

    const paymentNote = isCod
      ? `<div style="padding:14px;background:#F5F5F0;border-left:3px solid #111;margin:20px 0;font-size:13px;">
          <strong>Payment Method: Cash on Delivery (COD)</strong><br />
          Amount to be paid in cash/UPI upon doorstep delivery: <strong>₹${totalRupees}</strong>
         </div>`
      : `<div style="padding:14px;background:#ECFDF5;border-left:3px solid #059669;margin:20px 0;font-size:13px;color:#065F46;">
          <strong>Prepaid Payment Verified & Confirmed</strong><br />
          Transaction Reference: <code>${order.payment?.razorpayPaymentId || 'Verified Online'}</code><br />
          Amount Paid: <strong>₹${totalRupees}</strong>
         </div>`;

    const itemsListHtml = (order.items || []).map(item => `
      <tr style="border-bottom: 1px solid #F0F0EC;">
        <td style="padding: 10px 0; font-size: 13px;">
          <strong>${item.productName}</strong><br />
          <span style="color:#737373;font-size:11px;">Size: ${item.selectedSize} • Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 10px 0; text-align: right; font-size: 13px; font-family: monospace;">
          ₹${(item.lineTotalPaise / 100).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const contentHtml = `
      <h2 class="heading">Thank you for your order, ${order.customer?.name?.split(' ')[0] || 'Customer'}!</h2>
      <p class="paragraph">Your order <strong>#${order.orderNumber}</strong> has been received and confirmed by our atelier.</p>
      ${paymentNote}
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 10px;">Order Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>
      <div style="margin-top:20px;padding-top:14px;border-top:1px solid #111;display:flex;justify-content:space-between;">
        <p style="margin:0;font-size:14px;font-weight:700;">Total Amount: ₹${totalRupees}</p>
      </div>
      <div style="margin-top:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;color:#737373;">Delivery Address:</p>
        <p style="margin:0;font-size:13px;color:#404040;line-height:1.5;">
          ${order.shippingAddress?.fullName}<br />
          ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.addressLine2 || ''}<br />
          ${order.shippingAddress?.city}, ${order.shippingAddress?.state} — ${order.shippingAddress?.postalCode}<br />
          Phone: ${order.shippingAddress?.phone}
        </p>
      </div>
    `;

    const text = `BLANC ATELIER - Order Confirmed (#${order.orderNumber})\n\n` +
      `Thank you for your order!\n` +
      (isCod ? `Cash on Delivery: ₹${totalRupees} due at delivery.\n` : `Prepaid Online: ₹${totalRupees} paid.\n`) +
      `Delivery to: ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city} - ${order.shippingAddress?.postalCode}`;

    return await this.sendMail({
      to: order.customer.email,
      subject,
      html: this.getBaseHtmlTemplate({ title: `Order Confirmed #${order.orderNumber}`, contentHtml }),
      text
    });
  }

  /**
   * 4. Payment Failure / Retry Notice
   */
  async sendPaymentFailureNotice({ order, retryUrl }) {
    const subject = `Payment Notice for Order #${order.orderNumber} — BLANC ATELIER`;
    const contentHtml = `
      <h2 class="heading">Payment Was Unsuccessful</h2>
      <p class="paragraph">We noticed that your online payment attempt for order <strong>#${order.orderNumber}</strong> was not completed.</p>
      <p class="paragraph">Don't worry — your item selection is saved. You can securely retry your payment using the link below:</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${retryUrl || `http://localhost:5173/checkout?retry=${order._id}`}" class="btn">Retry Payment Securely</a>
      </div>
      <p class="paragraph" style="font-size:12px;color:#737373;">If you continue having trouble or wish to switch to Cash on Delivery (COD), please contact us.</p>
    `;

    return await this.sendMail({
      to: order.customer.email,
      subject,
      html: this.getBaseHtmlTemplate({ title: 'Payment Unsuccessful', contentHtml }),
      text: `Your payment for order #${order.orderNumber} was not completed. You can retry your payment at: ${retryUrl}`
    });
  }

  /**
   * 5. Order Shipped Notification
   */
  async sendOrderShipped({ order }) {
    const subject = `Your BLANC ATELIER Order #${order.orderNumber} Has Shipped!`;
    const contentHtml = `
      <h2 class="heading">Your Order is on the Way</h2>
      <p class="paragraph">Great news! Order <strong>#${order.orderNumber}</strong> has been carefully packed and handed over to our courier partner.</p>
      <div style="padding:16px;background:#F8F8F6;border:1px solid #E5E5E0;border-radius:4px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:12px;color:#737373;text-transform:uppercase;">Courier Partner</p>
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;">${order.tracking?.carrier || 'Delhivery / BlueDart'}</p>
        <p style="margin:0 0 6px;font-size:12px;color:#737373;text-transform:uppercase;">Tracking / AWB Number</p>
        <p style="margin:0;font-size:15px;font-family:monospace;font-weight:700;">${order.tracking?.trackingNumber || 'Pending AWB'}</p>
      </div>
      ${order.tracking?.trackingUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${order.tracking.trackingUrl}" class="btn" target="_blank">Track Live Shipment</a>
        </div>
      ` : ''}
    `;

    return await this.sendMail({
      to: order.customer.email,
      subject,
      html: this.getBaseHtmlTemplate({ title: `Order Shipped #${order.orderNumber}`, contentHtml }),
      text: `Your order #${order.orderNumber} has shipped with ${order.tracking?.carrier || 'courier'}. Tracking: ${order.tracking?.trackingNumber}`
    });
  }

  /**
   * 6. Order Delivered Notification
   */
  async sendOrderDelivered({ order }) {
    const subject = `Delivered: Order #${order.orderNumber} — BLANC ATELIER`;
    const contentHtml = `
      <h2 class="heading">Your Package Has Been Delivered</h2>
      <p class="paragraph">Order <strong>#${order.orderNumber}</strong> has been marked as delivered. We hope you love your new minimalist heavyweight apparel.</p>
      <p class="paragraph">If you have any feedback on print quality, fabric, or fit, reply to this email or leave a verified review on our website.</p>
    `;

    return await this.sendMail({
      to: order.customer.email,
      subject,
      html: this.getBaseHtmlTemplate({ title: `Order Delivered #${order.orderNumber}`, contentHtml }),
      text: `Order #${order.orderNumber} has been delivered. Thank you for choosing BLANC ATELIER.`
    });
  }

  /**
   * 7. Order Cancelled / Refund Notification
   */
  async sendOrderCancelled({ order, reason }) {
    const subject = `Order Cancellation Notice: #${order.orderNumber}`;
    const contentHtml = `
      <h2 class="heading">Order #${order.orderNumber} Has Been Cancelled</h2>
      <p class="paragraph">We would like to inform you that your order has been cancelled.</p>
      ${reason ? `<p class="paragraph"><strong>Reason:</strong> ${reason}</p>` : ''}
      ${order.paymentStatus === 'REFUNDED' || order.payment?.status === 'refunded' ? `
        <p class="paragraph">Any prepaid amount has been queued for a full refund back to your original payment method. Depending on your bank, it may take 5–7 business days to reflect.</p>
      ` : ''}
    `;

    return await this.sendMail({
      to: order.customer.email,
      subject,
      html: this.getBaseHtmlTemplate({ title: `Order Cancelled #${order.orderNumber}`, contentHtml }),
      text: `Order #${order.orderNumber} has been cancelled. Reason: ${reason || 'N/A'}`
    });
  }
}

module.exports = new EmailService();
