import { Storage } from './storage';
import { User, Booking, Quote } from '../types';

export interface EmailLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  previewText: string;
  htmlBody: string;
  sentAt: string;
  type: 'WELCOME' | 'ORDER_CONFIRMED' | 'QUOTE_RECEIVED' | 'SECURITY';
  read?: boolean;
}

const STORAGE_EMAIL_KEY = 'hb_email_logs_v1';

export function getEmailLogs(): EmailLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_EMAIL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEmailLog(log: EmailLog): void {
  if (typeof window === 'undefined') return;
  try {
    const logs = getEmailLogs();
    logs.unshift(log); // newest first
    window.localStorage.setItem(STORAGE_EMAIL_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('hb_email_sent', { detail: log }));
    window.dispatchEvent(new CustomEvent('hb_storage_update', { detail: { key: STORAGE_EMAIL_KEY } }));
  } catch (e) {
    console.error('Email log error:', e);
  }
}

/**
 * Send Welcome Account Creation Email to User
 */
export function sendWelcomeAccountEmail(user: User): EmailLog {
  const isSeller = user.role === 'SELLER';
  const subject = `🎉 Welcome to HomeBiz Pakistan! Your ${isSeller ? 'Seller Storefront' : 'Customer Account'} is Active`;
  const previewText = `Assalam-o-Alaikum ${user.name}! Your HomeBiz Pakistan account (${user.email}) has been successfully created.`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e3e2e1; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #003527; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🇵🇰 HomeBiz Pakistan</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #b0f0d6;">Verified Home Businesses & Artisanal Creators Marketplace</p>
      </div>

      <div style="padding: 24px; color: #1a1c1c; font-size: 14px; line-height: 1.6;">
        <h2 style="color: #003527; margin-top: 0;">Account Created Successfully! 🎉</h2>
        <p>Assalam-o-Alaikum <strong>${user.name}</strong>,</p>
        <p>Your HomeBiz Pakistan ${isSeller ? 'Merchant Storefront' : 'Customer Account'} has been successfully registered with email: <strong style="color: #003527;">${user.email}</strong> in <strong>${user.city}</strong>.</p>
        
        ${
          isSeller
            ? `<div style="background: #FFF1E7; border-left: 4px solid #cca72f; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                <strong style="color: #735c00;">Seller Hub Ready!</strong> You can now add your home baking, tailoring, catering, or craft packages, manage customer orders, and reply to broadcast quotes!
               </div>`
            : `<div style="background: #b0f0d6/30; border-left: 4px solid #003527; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                <strong style="color: #003527;">Start Exploring!</strong> Discover top-rated home creators in ${user.city}, place instant bookings, or post custom request broadcasts for your upcoming events!
               </div>`
        }

        <p style="margin-top: 20px;">If you ever have questions or need assistance, our support team is available 24/7 at <a href="mailto:support@homebiz.pk" style="color: #003527; font-weight: bold;">support@homebiz.pk</a>.</p>
        <p>Warm regards,<br><strong>The HomeBiz Pakistan Team</strong></p>
      </div>

      <div style="background: #faf9f8; padding: 16px; text-align: center; font-size: 11px; color: #665d55; border-top: 1px solid #e3e2e1;">
        HomeBiz Pakistan • Empowering Micro-Entrepreneurs Nationwide<br>
        Security Reference ID: HB-AUTH-${user.id}
      </div>
    </div>
  `;

  const log: EmailLog = {
    id: `email-${Date.now()}`,
    to: user.email,
    recipientName: user.name,
    subject,
    previewText,
    htmlBody,
    sentAt: new Date().toISOString(),
    type: 'WELCOME',
  };

  saveEmailLog(log);

  // Also push to in-app notifications
  Storage.createNotification({
    id: `notif-${Date.now()}`,
    userId: user.id,
    title: '📧 Welcome Email Sent!',
    message: `Account creation confirmation email sent to ${user.email}`,
    type: 'SYSTEM_ANNOUNCEMENT',
    link: isSeller ? '/seller/dashboard' : '/customer/dashboard/bookings',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return log;
}

/**
 * Send Booking Order Confirmation Email to Customer
 */
export function sendBookingConfirmationEmail(booking: Booking): EmailLog {
  const subject = `✅ Booking Confirmed #${booking.bookingNumber} - ${booking.vendorName}`;
  const previewText = `Your booking for ${booking.serviceTitle} on ${booking.date} (${booking.timeSlot}) has been confirmed!`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e3e2e1; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #003527; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🇵🇰 HomeBiz Pakistan</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #b0f0d6;">Order Receipt & Confirmation</p>
      </div>

      <div style="padding: 24px; color: #1a1c1c; font-size: 14px; line-height: 1.6;">
        <h2 style="color: #003527; margin-top: 0;">Order #${booking.bookingNumber} Confirmed!</h2>
        <p>Assalam-o-Alaikum <strong>${booking.customerName}</strong>,</p>
        <p>Your booking with <strong>${booking.vendorName}</strong> has been successfully placed and confirmed.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e3e2e1;"><td style="padding: 8px 0; color: #665d55;">Service:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.serviceTitle}</td></tr>
          <tr style="border-bottom: 1px solid #e3e2e1;"><td style="padding: 8px 0; color: #665d55;">Date & Slot:</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #003527;">${booking.date} (${booking.timeSlot})</td></tr>
          <tr style="border-bottom: 1px solid #e3e2e1;"><td style="padding: 8px 0; color: #665d55;">Total Paid/Payable:</td><td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 15px; color: #003527;">Rs. ${booking.total.toLocaleString()}</td></tr>
          <tr style="border-bottom: 1px solid #e3e2e1;"><td style="padding: 8px 0; color: #665d55;">Payment Method:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.paymentMethod}</td></tr>
        </table>

        <p>Creator <strong>${booking.vendorName}</strong> has been notified and will prepare your order for delivery/pickup.</p>
      </div>
    </div>
  `;

  const log: EmailLog = {
    id: `email-${Date.now()}`,
    to: booking.customerEmail,
    recipientName: booking.customerName,
    subject,
    previewText,
    htmlBody,
    sentAt: new Date().toISOString(),
    type: 'ORDER_CONFIRMED',
  };

  saveEmailLog(log);
  return log;
}
