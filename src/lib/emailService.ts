import { Storage } from './storage';
import { User, Booking, Quote } from '../types';
import emailjs from '@emailjs/browser';
import { supabase, isSupabaseConfigured } from './supabase';

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

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_t425wug';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_zbcaqua';
const EMAILJS_OTP_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID || 'template_991y4lf';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'VYs3Z08YeNDcVkc8t';

export const isEmailJsConfigured = Boolean(
  EMAILJS_SERVICE_ID && (EMAILJS_TEMPLATE_ID || EMAILJS_OTP_TEMPLATE_ID) && EMAILJS_PUBLIC_KEY
);

/**
 * Dispatch real email through EmailJS to customer inbox
 */
export async function sendLiveEmail(
  templateParams: Record<string, any>,
  customTemplateId?: string
): Promise<{ success: boolean; error?: string }> {
  const activeTemplateId = customTemplateId || EMAILJS_TEMPLATE_ID;
  if (!EMAILJS_SERVICE_ID || !activeTemplateId || !EMAILJS_PUBLIC_KEY) {
    console.info('ℹ️ EmailJS not configured in .env yet. Email logged locally.');
    return { success: false, error: 'EmailJS credentials not configured in .env' };
  }
  try {
    const res = await emailjs.send(
      EMAILJS_SERVICE_ID,
      activeTemplateId,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('✅ Real email sent successfully via EmailJS:', res.status, res.text);
    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.text || err?.message || 'EmailJS service rejected request';
    console.error('⚠️ EmailJS dispatch failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
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

  // Dispatch real welcome email via EmailJS to user inbox
  sendLiveEmail({
    to_email: user.email,
    to_name: user.name,
    subject,
    user_role: user.role,
    city: user.city,
    message: previewText,
  }).catch((e) => console.warn('EmailJS welcome email error:', e));

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

  // Dispatch real order receipt email via EmailJS to customer inbox
  sendLiveEmail({
    to_email: booking.customerEmail,
    email: booking.customerEmail,
    user_email: booking.customerEmail,
    to_name: booking.customerName,
    name: booking.customerName,
    customer_name: booking.customerName,
    booking_number: booking.bookingNumber,
    order_id: booking.bookingNumber,
    order_number: booking.bookingNumber,
    service_title: booking.serviceTitle,
    item_name: booking.serviceTitle,
    vendor_name: booking.vendorName,
    seller_name: booking.vendorName,
    date: booking.date,
    time_slot: booking.timeSlot,
    total_amount: `Rs. ${booking.total.toLocaleString()}`,
    amount: `Rs. ${booking.total.toLocaleString()}`,
    price: `Rs. ${booking.total.toLocaleString()}`,
    payment_method: booking.paymentMethod,
    delivery_address: booking.deliveryAddress || 'Pick-up / Local address',
    address: booking.deliveryAddress || 'Pick-up / Local address',
    subject,
    message: `Your booking #${booking.bookingNumber} for "${booking.serviceTitle}" with ${booking.vendorName} has been confirmed for ${booking.date} (${booking.timeSlot}). Total: Rs. ${booking.total.toLocaleString()} via ${booking.paymentMethod}.`,
  }).catch((e) => console.warn('EmailJS booking dispatch error:', e));

  return log;
}

/**
 * Send 4-Digit OTP Email Verification Code
 */
export async function sendOtpVerificationEmail({
  toEmail,
  recipientName,
  otp,
}: {
  toEmail: string;
  recipientName: string;
  otp: string;
}): Promise<{ log: EmailLog; success: boolean; error?: string }> {
  const subject = `🔐 ${otp} is your HomeBiz Verification Code`;
  const previewText = `Your 4-digit verification code is ${otp}. Enter this code to complete your registration on HomeBiz (Pakistan & Australia).`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e3e2e1; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #003527; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">HomeBiz • Pakistan & Australia</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #b0f0d6;">Email Security & Identity Verification</p>
      </div>

      <div style="padding: 24px; color: #1a1c1c; font-size: 14px; line-height: 1.6;">
        <h2 style="color: #003527; margin-top: 0;">Verify Your Email Address</h2>
        <p>Assalam-o-Alaikum <strong>${recipientName}</strong>,</p>
        <p>Thank you for signing up for HomeBiz. Please enter the following 4-digit verification code to confirm your email address and activate your account:</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #faf9f8; border: 2px solid #003527; border-radius: 14px; padding: 14px 28px; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #003527; font-family: monospace;">
            ${otp}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #665d55;">This code expires in 10 minutes. Do not share this code with anyone.</p>
        </div>

        <p>If you did not initiate this registration, you can safely disregard this message.</p>
        <p>Warm regards,<br><strong>The HomeBiz Security Team</strong></p>
      </div>

      <div style="background: #faf9f8; padding: 16px; text-align: center; font-size: 11px; color: #665d55; border-top: 1px solid #e3e2e1;">
        HomeBiz • Pakistan & Australia Marketplace • Support: support@homebiz.pk
      </div>
    </div>
  `;

  const log: EmailLog = {
    id: `email-otp-${Date.now()}`,
    to: toEmail,
    recipientName,
    subject,
    previewText,
    htmlBody,
    sentAt: new Date().toISOString(),
    type: 'SECURITY',
  };

  saveEmailLog(log);

  // Store OTP record in real Supabase database if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('otp_verifications').insert({
        email: toEmail.trim().toLowerCase(),
        otp_code: otp,
        verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
    } catch (dbErr) {
      console.warn('Supabase OTP record notice:', dbErr);
    }
  }

  // Dispatch real email via EmailJS
  const result = await sendLiveEmail({
    to_email: toEmail,
    email: toEmail,
    user_email: toEmail,
    to: toEmail,
    recipient: toEmail,
    reply_to: toEmail,
    to_name: recipientName,
    name: recipientName,
    otp,
    otp_code: otp,
    verification_code: otp,
    subject,
    message: `Assalam-o-Alaikum ${recipientName}, your 4-digit verification code for HomeBiz (Pakistan & Australia) is: ${otp}. Please enter this code to complete your registration.`,
  }, EMAILJS_OTP_TEMPLATE_ID);

  return {
    log,
    success: result.success,
    error: result.error,
  };
}

/**
 * Mark OTP as verified in Supabase real database
 */
export async function markOtpVerifiedInSupabase(email: string, otp: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('email', email.trim().toLowerCase())
      .eq('otp_code', otp.trim());
  } catch (err) {
    console.warn('Supabase mark OTP verified notice:', err);
  }
}

/**
 * Send Seller Storefront Admin Approval Email
 */
export async function sendSellerVerificationApprovalEmail(
  sellerEmail: string,
  sellerName: string,
  businessName: string
): Promise<EmailLog> {
  const subject = `🎉 Verified Seller: Your HomeBiz Store "${businessName}" is Approved!`;
  const previewText = `Congratulations ${sellerName}! Your seller account and storefront "${businessName}" have been verified by HomeBiz Admin.`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e3e2e1; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #003527; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">HomeBiz • Pakistan & Australia</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #b0f0d6;">Verified Merchant Network</p>
      </div>

      <div style="padding: 24px; color: #1a1c1c; font-size: 14px; line-height: 1.6;">
        <h2 style="color: #003527; margin-top: 0;">Congratulations! Storefront Verified 🎉</h2>
        <p>Assalam-o-Alaikum <strong>${sellerName}</strong>,</p>
        <p>Great news! The HomeBiz Platform Administrator has reviewed and verified your seller profile for <strong>${businessName}</strong>.</p>
        
        <div style="background: #b0f0d6/30; border-left: 4px solid #003527; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
          <strong style="color: #003527;">Status: REAL VERIFIED SELLER</strong><br>
          Your store is now featured with the official Verified Seller badge across Pakistan and Australia! Customers can discover and order your artisanal creations directly.
        </div>

        <p>Log in to your Seller Hub anytime to add packages, update menus, and reply to client inquiries.</p>
        <p>Warm regards,<br><strong>HomeBiz Administrator Team</strong></p>
      </div>
    </div>
  `;

  const log: EmailLog = {
    id: `email-verify-${Date.now()}`,
    to: sellerEmail,
    recipientName: sellerName,
    subject,
    previewText,
    htmlBody,
    sentAt: new Date().toISOString(),
    type: 'WELCOME',
  };

  saveEmailLog(log);

  // Dispatch real email via EmailJS
  sendLiveEmail({
    to_email: sellerEmail,
    email: sellerEmail,
    user_email: sellerEmail,
    to_name: sellerName,
    business_name: businessName,
    subject,
    message: `Congratulations ${sellerName}! Your HomeBiz seller store "${businessName}" has been approved and verified by the Platform Administrator. Your listings are now live across Pakistan & Australia.`,
  }).catch((err) => console.warn('EmailJS seller approval error:', err));

  return log;
}

