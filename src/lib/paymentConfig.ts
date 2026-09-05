/**
 * Official HomeBiz Platform Payment & Escrow Account Configurations
 * 
 * Update these details with your real Meezan/HBL/Allied bank account,
 * JazzCash Merchant/Till, and Easypaisa Merchant details.
 */
export const PLATFORM_PAYMENT_CONFIG = {
  // Official Business Details
  companyName: 'HomeBiz Platform (Pakistan & Australia)',
  supportWhatsApp: '+92 309 2266482',
  supportEmail: 'billing@homebiz.pk',

  // 1. PayPal Automated Live Gateway (Australia & Global)
  paypal: {
    accountName: 'Erum Nazir',
    email: 'bayastcghins@gmail.com',
    clientId: 'test', // Live or sandbox PayPal Client ID from developer.paypal.com
    currency: 'AUD',
    mode: 'live' as 'live' | 'sandbox',
    isAutomaticGateway: true,
    supportedCurrencies: ['AUD', 'USD', 'PKR'],
    country: 'Australia',
    instructions: 'Automated Live PayPal Verification: Payments are captured and verified in real-time via PayPal API before order confirmation.',
  },

  // 2. Direct Bank Transfer (IBFT) Details
  bank: {
    bankName: 'Askari Commercial Bank',
    accountTitle: 'Rao Muhammad Haroon',
    accountNumber: '03080320028116',
    iban: 'PK65ASCM0003080320028116',
    branch: 'Askari Commercial Bank Pakistan',
  },

  // 3. JazzCash Mobile Account
  jazzCash: {
    title: 'Erum Nazir',
    number: '0309 2266482',
    rawNumber: '03092266482',
    instructions: 'Open JazzCash App or Dial *786# > Send Money to Mobile Account (0309 2266482 - Erum Nazir)',
  },

  // 4. Easypaisa Mobile Account
  easypaisa: {
    title: 'Erum Nazir',
    number: '0309 2266482',
    rawNumber: '03092266482',
    instructions: 'Open Easypaisa App > Send Money to Easypaisa Wallet / Mobile Account (0309 2266482 - Erum Nazir)',
  },

  // 5. Card Processing
  card: {
    provider: 'Stripe Australia & Safepay / PayFast Pakistan',
    currency: 'AUD & PKR',
  },

  // Escrow & Protection Policy Notice
  escrowPolicy:
    'HomeBiz SafePay Escrow: Your payment is held securely in platform escrow and is only released to the home creator after your order is delivered to your satisfaction. Australian orders covered under PayPal Buyer Protection.',

  // Pro Subscription Policy Notice
  subscriptionPolicy:
    'HomeBiz Official Billing: 100% of seller subscription fee is directly credited to HomeBiz Platform services to unlock priority listing, verified badges, and Australian market features.',
};

export function getPayPalClientId(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('homebiz_paypal_client_id');
    if (saved && saved.trim()) return saved.trim();
  }
  return PLATFORM_PAYMENT_CONFIG.paypal.clientId;
}

export function setPayPalClientId(clientId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('homebiz_paypal_client_id', clientId.trim());
  }
}

