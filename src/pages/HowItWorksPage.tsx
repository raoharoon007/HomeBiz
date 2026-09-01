import React from 'react';
import { Link } from '../lib/navigation';
import {
  Search,
  MessageSquare,
  Calendar,
  ShieldCheck,
  Award,
  Sparkles,
  TrendingUp,
  CreditCard,
  Truck,
  HeartHandshake,
  CheckCircle,
} from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
          Platform Architecture & Process
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
          How HomeBiz Operates
        </h1>
        <p className="text-xs sm:text-sm text-[#665d55] leading-relaxed">
          We empower home-based businesses with automated scheduling, verified customer reviews, direct bilingual messaging, and protected payments.
        </p>
      </div>

      {/* For Customers Flow */}
      <div className="space-y-8">
        <div className="border-b border-[#e3e2e1] pb-4">
          <span className="text-xs font-bold text-[#003527] uppercase tracking-wider">
            Customer Journey
          </span>
          <h2 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Ordering from Verified Home Creators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#003527] text-[#ffe088] flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-base text-[#1a1c1c]">Browse & Inquire</h3>
            <p className="text-xs text-[#404944] leading-relaxed">
              Explore menus, check portfolios, notice periods, and chat in real time with the creator to confirm custom design details.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#003527] text-[#ffe088] flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-base text-[#1a1c1c]">Instant Book or Custom Quote</h3>
            <p className="text-xs text-[#404944] leading-relaxed">
              Choose an instant service package with add-ons or post a custom request with your target PKR budget and event date.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#003527] text-[#ffe088] flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-base text-[#1a1c1c]">Safe Handover & Review</h3>
            <p className="text-xs text-[#404944] leading-relaxed">
              Receive your artisanal order at your doorstep. Pay via Cash on Delivery or Mobile Wallet, and leave a verified review.
            </p>
          </div>
        </div>
      </div>

      {/* For Sellers Flow */}
      <div className="space-y-8">
        <div className="border-b border-[#e3e2e1] pb-4">
          <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
            Seller Ecosystem
          </span>
          <h2 className="text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Scaling Your Home Business
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1E7] text-[#735c00] flex items-center justify-center font-bold text-lg">
              A
            </div>
            <h3 className="font-bold text-base text-[#1a1c1c]">Digital Storefront</h3>
            <p className="text-xs text-[#404944] leading-relaxed">
              Set up your menu, prices, add-ons, photos, and delivery zones. Get verified with your CNIC to earn the Gold Trust Badge.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1E7] text-[#735c00] flex items-center justify-center font-bold text-lg">
              B
            </div>
            <h3 className="font-bold text-base text-[#1a1c1c]">Quote on Broadcasts</h3>
            <p className="text-xs text-[#404944] leading-relaxed">
              Receive broadcast alerts when customers in your city need custom catering, tailoring, or cakes. Send itemized quotes in seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1E7] text-[#735c00] flex items-center justify-center font-bold text-lg">
              C
            </div>
            <h3 className="font-bold text-base text-[#1a1c1c]">Keep 95% Earnings</h3>
            <p className="text-xs text-[#404944] leading-relaxed">
              Enjoy the lowest platform fee (5%) in Pakistan and Australia. Payouts are transferred weekly to your JazzCash, Easypaisa, Pakistani Bank Account, or Australian Bank Account.
            </p>
          </div>
        </div>
      </div>

      {/* HomeBiz SafeGuarantee */}
      <div className="bg-[#003527] text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-[#ffe088] font-bold text-xs">
          <ShieldCheck className="w-5 h-5" />
          <span>HomeBiz SafeGuarantee Standards</span>
        </div>
        <h3 className="text-xl sm:text-3xl font-black font-['Plus_Jakarta_Sans']">
          Our 100% Satisfaction & Safety Policy
        </h3>
        <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
          Every verified seller passes identity authentication and food safety / hygiene checks. In the rare event of non-delivery or quality discrepancy, our resolution team mediates full refunds or replacements within 24 hours.
        </p>
      </div>
    </div>
  );
}
