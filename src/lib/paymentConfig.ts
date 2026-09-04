/**
 * Official HomeBiz Platform Payment & Escrow Account Configurations
 * 
 * Update these details with your real Meezan/HBL/Allied bank account,
 * JazzCash Merchant/Till, and Easypaisa Merchant details.
 */
export const PLATFORM_PAYMENT_CONFIG = {
  // Official Business Details
  companyName: 'HomeBiz Pakistan (SMC-Pvt) Ltd',
  supportWhatsApp: '+92 300 8472910',
  supportEmail: 'billing@homebiz.pk',

  // 1. Direct Bank Transfer (IBFT) Details
  bank: {
    bankName: 'Meezan Bank Ltd',
    accountTitle: 'HomeBiz Pakistan (Pvt) Ltd',
    accountNumber: '02340105892101',
    iban: 'PK45MEZN0002340105892101',
    branch: 'Main Gulberg III, Lahore',
  },

  // 2. JazzCash Mobile Account & Merchant Till
  jazzCash: {
    title: 'HomeBiz Pakistan',
    number: '0300 8472910',
    tillId: '584920',
    instructions: 'Dial *786# or open JazzCash App > Send Money to Mobile Account / Till ID',
  },

  // 3. Easypaisa Mobile Account & Till
  easypaisa: {
    title: 'HomeBiz Pakistan',
    number: '0345 8472910',
    instructions: 'Open Easypaisa App > Send Money to Mobile Account / Easypaisa Wallet',
  },

  // 4. Card Processing
  card: {
    provider: 'Safepay / PayFast Pakistan & Stripe Australia',
    currency: 'PKR',
  },

  // Escrow & Protection Policy Notice
  escrowPolicy:
    'HomeBiz SafePay Escrow: Your payment is held securely in platform escrow and is only released to the home creator after your order is delivered to your satisfaction.',

  // Pro Subscription Policy Notice
  subscriptionPolicy:
    'HomeBiz Official Billing: 100% of seller subscription fee is directly credited to HomeBiz Pakistan Platform services to unlock priority listing and verified badges.',
};
