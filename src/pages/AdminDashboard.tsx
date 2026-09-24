import React, { useState } from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import {
  ShieldCheck,
  Users,
  Store,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  Star,
  Award,
  DollarSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { useAuth } from '../lib/authContext';
import { sendSellerVerificationApprovalEmail } from '../lib/emailService';
import { isAustralianLocation } from '../lib/countryUtils';
import { AdminPricingManager } from './AdminPricingManager';

export function AdminDashboard() {
  useStorageSubscription();
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 text-[#ba1a1a] mx-auto flex items-center justify-center font-bold text-lg">
          🛡️
        </div>
        <h2 className="text-xl font-bold text-[#1a1c1c]">Admin Access Restricted</h2>
        <p className="text-xs text-[#665d55]">
          Please sign in with authorized Platform Administrator credentials (e.g. <strong>admin@homebiz.pk</strong>) to access platform control panel.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/auth/login" className="px-6 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]">
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  let activeTab = 'overview';
  if (pathname.includes('/vendors')) activeTab = 'vendors';
  else if (pathname.includes('/subscriptions')) activeTab = 'subscriptions';
  else if (pathname.includes('/pricing')) activeTab = 'pricing';
  else if (pathname.includes('/categories')) activeTab = 'categories';
  else if (pathname.includes('/cities')) activeTab = 'cities';
  else if (pathname.includes('/bookings')) activeTab = 'bookings';

  const [vendorFilter, setVendorFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  const vendors = Storage.getVendors();
  const allUsers = Storage.getUsers();
  const bookings = Storage.getBookings();
  const categories = Storage.getCategories();
  const cities = Storage.getCities();
  const requests = Storage.getRequests();
  const subscriptions = Storage.getSubscriptions();

  const totalGMV = bookings.reduce((sum, b) => sum + b.total, 0);
  const platformRevenue = Math.round(totalGMV * 0.05);

  const pendingVendors = vendors.filter((v) => v.verificationStatus === 'PENDING');
  const verifiedVendors = vendors.filter((v) => v.verificationStatus === 'VERIFIED');
  const rejectedVendors = vendors.filter((v) => v.verificationStatus === 'REJECTED');

  const pendingSubscriptions = subscriptions.filter(
    (s) => s.status === 'PENDING_VERIFICATION' || s.paymentStatus === 'PENDING_VERIFICATION'
  );

  const filteredVendors = vendors.filter((v) => {
    if (vendorFilter === 'PENDING') return v.verificationStatus === 'PENDING';
    if (vendorFilter === 'VERIFIED') return v.verificationStatus === 'VERIFIED';
    if (vendorFilter === 'REJECTED') return v.verificationStatus === 'REJECTED';
    return true;
  });

  const navTabs = [
    { id: 'overview', label: 'Platform KPIs', path: '/admin/dashboard/overview', icon: TrendingUp },
    { id: 'vendors', label: 'Vendor Verifications', path: '/admin/dashboard/vendors', icon: Store, badge: pendingVendors.length },
    { id: 'subscriptions', label: 'Partner Subscriptions', path: '/admin/dashboard/subscriptions', icon: DollarSign, badge: pendingSubscriptions.length },
    { id: 'pricing', label: 'Pricing Plans', path: '/admin/dashboard/pricing', icon: Award },
    { id: 'categories', label: 'Categories', path: '/admin/dashboard/categories', icon: Layers, badge: categories.length },
    { id: 'cities', label: 'Active Cities', path: '/admin/dashboard/cities', icon: MapPin, badge: cities.length },
    { id: 'bookings', label: 'All Platform Orders', path: '/admin/dashboard/bookings', icon: Calendar, badge: bookings.length },
  ];

  const handleVerifyVendor = (vendorId: string) => {
    Storage.updateVendorVerification(vendorId, 'VERIFIED');
    const targetVendor = Storage.getVendorById(vendorId);
    if (targetVendor) {
      const sellerUser = allUsers.find(
        (u) => u.id === targetVendor.userId || u.sellerProfileId === targetVendor.id
      );

      // Create platform notification
      Storage.createNotification({
        id: `notif-verified-${Date.now()}`,
        userId: targetVendor.userId,
        title: '🎉 Storefront Approved & Verified',
        message: `Congratulations! Your seller storefront "${targetVendor.businessName}" has been approved by the HomeBiz Administrator as a Real Verified Seller.`,
        type: 'SYSTEM_ANNOUNCEMENT',
        link: '/seller/dashboard',
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Send real email notification
      if (sellerUser?.email) {
        sendSellerVerificationApprovalEmail(
          sellerUser.email,
          sellerUser.name,
          targetVendor.businessName
        );
      }
    }
    confetti({ particleCount: 80, spread: 70 });
  };

  const handleRejectVendor = (vendorId: string) => {
    Storage.updateVendorVerification(vendorId, 'REJECTED');
    const targetVendor = Storage.getVendorById(vendorId);
    if (targetVendor) {
      Storage.createNotification({
        id: `notif-rejected-${Date.now()}`,
        userId: targetVendor.userId,
        title: '⚠️ Storefront Verification Update',
        message: `Your storefront "${targetVendor.businessName}" requires additional details before approval. Please contact administrator support.`,
        type: 'SYSTEM_ANNOUNCEMENT',
        link: '/seller/dashboard/profile',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleToggleFeatured = (vendorId: string) => {
    Storage.toggleVendorFeatured(vendorId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Top Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ffe088]" />
            <h1 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans']">
              HomeBiz Super Admin Control - Pakistan & Australia
            </h1>
          </div>
          <p className="text-xs text-stone-400">
            Platform governance, merchant verification, commissions, and category management.
          </p>
        </div>
      </div>

      {/* Main Grid: Tabs + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-3 border border-[#e3e2e1] shadow-xs space-y-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${isSelected
                    ? 'bg-[#003527] text-white shadow-xs'
                    : 'text-[#404944] hover:bg-[#faf9f8]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#ffe088]' : 'text-[#665d55]'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isSelected ? 'bg-white text-[#003527]' : 'bg-[#f4f3f2] text-[#404944]'
                      }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Gross Marketplace GMV
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#003527] block">
                    Rs. {totalGMV.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Total Order Volume</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Platform Revenue (5%)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#735c00] block">
                    Rs. {platformRevenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#cca72f] font-semibold">Net Earned</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Registered Sellers
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#1a1c1c] block">
                    {vendors.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {verifiedVendors.length} Verified
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Total Bookings
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#1a1c1c] block">
                    {bookings.length}
                  </span>
                  <span className="text-[10px] text-[#665d55]">{requests.length} Broadcast Requests</span>
                </div>
              </div>

              {/* Vendors Overview Table */}
              <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-[#1a1c1c]">Registered Home Businesses - Pakistan & Australia</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#faf9f8] text-[#665d55] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Store Name</th>
                        <th className="p-3">City</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Rating</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f3f2]">
                      {vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-[#faf9f8]">
                          <td className="p-3 font-bold text-[#1a1c1c]">
                            <div className="flex items-center gap-2">
                              <img src={v.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                              <span>{v.businessName}</span>
                            </div>
                          </td>
                          <td className="p-3 text-[#404944]">{v.city}</td>
                          <td className="p-3 text-[#404944]">{v.category}</td>
                          <td className="p-3 font-bold text-[#cca72f]">★ {v.rating.toFixed(1)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.verificationStatus === 'VERIFIED'
                                  ? 'bg-[#b0f0d6]/40 text-[#003527]'
                                  : 'bg-[#ffe088] text-[#735c00]'
                                }`}
                            >
                              {v.verificationStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <Link
                              href={`/vendors/${v.slug}`}
                              className="text-xs text-[#003527] font-semibold hover:underline"
                            >
                              View Profile
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENDOR VERIFICATIONS */}
          {activeTab === 'vendors' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#1a1c1c]">
                    Seller Verification & Governance Panel
                  </h2>
                  <p className="text-xs text-[#665d55]">
                    Verify genuine home creators across Pakistan and Australia before public activation.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1] overflow-x-auto">
                  {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setVendorFilter(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                        vendorFilter === st
                          ? 'bg-[#003527] text-white shadow-xs'
                          : 'text-[#665d55] hover:text-[#1a1c1c]'
                      }`}
                    >
                      {st === 'ALL' && `All (${vendors.length})`}
                      {st === 'PENDING' && `Pending (${pendingVendors.length})`}
                      {st === 'VERIFIED' && `Verified (${verifiedVendors.length})`}
                      {st === 'REJECTED' && `Rejected (${rejectedVendors.length})`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredVendors.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e3e2e1] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#f4f3f2] mx-auto flex items-center justify-center text-xl">
                    🏪
                  </div>
                  <h3 className="font-bold text-sm text-[#1a1c1c]">No Sellers Found in this Category</h3>
                  <p className="text-xs text-[#665d55]">
                    There are currently no sellers matching the selected verification filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVendors.map((v) => {
                    const sellerUser = allUsers.find(
                      (u) => u.id === v.userId || u.sellerProfileId === v.id
                    );
                    const isAus = isAustralianLocation(v.city);

                    return (
                      <div
                        key={v.id}
                        className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={v.avatar || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80'}
                            alt={v.businessName}
                            className="w-16 h-16 rounded-2xl object-cover border border-[#e3e2e1] flex-shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-sm sm:text-base text-[#1a1c1c]">
                                {v.businessName}
                              </h3>

                              {v.verificationStatus === 'VERIFIED' && (
                                <span className="text-[10px] bg-[#b0f0d6] text-[#003527] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Real Seller Verified</span>
                                </span>
                              )}

                              {v.verificationStatus === 'PENDING' && (
                                <span className="text-[10px] bg-[#ffe088] text-[#735c00] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                  ⏳ Verification Pending
                                </span>
                              )}

                              {v.verificationStatus === 'REJECTED' && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold">
                                  ❌ Rejected
                                </span>
                              )}

                              {v.isFeatured && (
                                <span className="text-[10px] bg-[#003527] text-white px-2 py-0.5 rounded-full font-bold">
                                  Featured
                                </span>
                              )}
                            </div>

                            {/* Seller Contact & Verification Attributes */}
                            <div className="text-xs text-[#665d55] flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-medium text-[#1a1c1c]">
                                👤 Owner: {sellerUser?.name || 'Seller'}
                              </span>
                              <span>•</span>
                              <span>
                                📧 <strong className="text-[#003527]">{sellerUser?.email || 'N/A'}</strong>
                              </span>
                              {sellerUser?.phone && (
                                <>
                                  <span>•</span>
                                  <span>📞 {sellerUser.phone}</span>
                                </>
                              )}
                            </div>

                            <div className="text-xs text-[#665d55] flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1 font-semibold text-[#1a1c1c]">
                                {isAus ? '🇦🇺 Australia' : '🇵🇰 Pakistan'} • {v.locality}, {v.city}
                              </span>
                              <span>•</span>
                              <span className="capitalize">Category: {v.category}</span>
                              <span>•</span>
                              <span>Starting from: {isAus ? `A$ ${v.startingPrice}` : `Rs. ${v.startingPrice}`}</span>
                            </div>

                            <p className="text-xs text-[#404944] line-clamp-1 max-w-xl">
                              {v.description}
                            </p>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-stretch lg:self-center justify-end">
                          <Link
                            href={`/vendors/${v.slug}`}
                            className="px-3 py-1.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold"
                          >
                            View Store
                          </Link>

                          <button
                            onClick={() => handleToggleFeatured(v.id)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                              v.isFeatured
                                ? 'bg-[#ffe088] text-[#735c00] border-[#ffe088]'
                                : 'bg-white text-stone-600 border-stone-300'
                            }`}
                          >
                            {v.isFeatured ? '★ Featured' : 'Feature'}
                          </button>

                          {v.verificationStatus !== 'VERIFIED' ? (
                            <>
                              <button
                                onClick={() => handleVerifyVendor(v.id)}
                                className="px-4 py-1.5 rounded-full bg-[#003527] text-white text-xs font-bold hover:bg-[#064e3b] shadow-xs flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-[#b0f0d6]" />
                                <span>Verify Real Seller</span>
                              </button>

                              {v.verificationStatus !== 'REJECTED' && (
                                <button
                                  onClick={() => handleRejectVendor(v.id)}
                                  className="px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                                >
                                  Reject
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => Storage.updateVendorVerification(v.id, 'PENDING')}
                              className="px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1a1c1c]">Marketplace Categories ({categories.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#1a1c1c]">{cat.name}</h3>
                      <span className="text-xs font-bold text-[#003527] bg-[#b0f0d6]/30 px-2.5 py-0.5 rounded-full">
                        {cat.vendorCount} sellers
                      </span>
                    </div>
                    <p className="text-xs text-[#665d55]">{cat.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cat.subcategories.map((sub, i) => (
                        <span key={i} className="text-[10px] bg-[#faf9f8] text-[#404944] px-2 py-0.5 rounded-full">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE CITIES */}
          {activeTab === 'cities' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1a1c1c]">Active Cities ({cities.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cities.map((city) => (
                  <div
                    key={city.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#1a1c1c]">{city.name}</h3>
                      <span className="text-xs font-semibold text-[#665d55]">{city.province}</span>
                    </div>
                    <span className="text-xs font-bold text-[#003527] block">
                      {city.vendorCount} Registered Creators
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ALL BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1a1c1c]">Platform Orders ({bookings.length})</h2>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#1a1c1c] block">
                        #{b.bookingNumber} • {b.serviceTitle}
                      </span>
                      <span className="text-[#665d55]">
                        Customer: {b.customerName} → Seller: {b.vendorName}
                      </span>
                      <p className="text-[#665d55] mt-0.5">
                        📅 {b.date} • 📍 {b.deliveryAddress}
                      </p>
                      {b.transactionId && (
                        <p className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md w-fit border border-emerald-200 mt-1">
                          TID / Ref: {b.transactionId}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1.5">
                      <span className="font-black text-sm text-[#003527] block">
                        Rs. {b.total.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          b.paymentMethod === 'PAYPAL'
                            ? 'bg-blue-100 text-[#003087]'
                            : 'bg-[#b0f0d6]/40 text-[#003527]'
                        }`}>
                          {b.status} ({b.paymentMethod === 'PAYPAL' ? '🅿️ PayPal' : b.paymentMethod})
                        </span>
                      </div>
                      {b.paymentMethod !== 'CASH_ON_DELIVERY' && (
                        <div className="flex items-center gap-1 justify-end pt-1">
                          {b.paymentStatus !== 'PAID' && (
                            <button
                              type="button"
                              onClick={() => {
                                Storage.updateBookingPaymentStatus(b.id, 'PAID');
                                window.location.reload();
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                              title="Verify payment received in bank/paypal account"
                            >
                              ✓ Verify Paid
                            </button>
                          )}
                          {b.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Mark this payment as unpaid/cancelled?')) {
                                  Storage.updateBookingPaymentStatus(b.id, 'FAILED');
                                  window.location.reload();
                                }
                              }}
                              className="px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 text-[10px] font-bold cursor-pointer"
                              title="Reject fake TID or unpaid booking"
                            >
                              ✗ Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PARTNER SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#1a1c1c]">
                    Seller Subscription Upgrades ({subscriptions.length})
                  </h2>
                  <p className="text-xs text-[#665d55]">
                    Verify seller payment transaction IDs to activate Pro & Featured partner badges
                  </p>
                </div>
                {pendingSubscriptions.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                    {pendingSubscriptions.length} Pending Verification
                  </span>
                )}
              </div>

              {subscriptions.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] text-center text-xs text-[#665d55]">
                  No partner subscription requests found.
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => {
                    const subVendor = Storage.getVendorById(sub.vendorId);
                    const isPending = sub.status === 'PENDING_VERIFICATION' || sub.paymentStatus === 'PENDING_VERIFICATION';
                    const isActive = sub.status === 'ACTIVE';

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1a1c1c] text-sm">
                              {subVendor?.businessName || `Vendor (${sub.vendorId.slice(0, 8)})`}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                sub.plan === 'featured'
                                  ? 'bg-[#FFF1E7] text-[#cca72f] border border-[#cca72f]/40'
                                  : 'bg-[#b0f0d6]/40 text-[#003527] border border-[#95d3ba]/40'
                              }`}
                            >
                              {sub.plan} Plan ({sub.billingPeriod})
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          <div className="text-[#665d55] flex flex-wrap items-center gap-3 text-[11px]">
                            <span>Amount: <strong>Rs. {sub.priceAtPurchase.toLocaleString()}</strong></span>
                            <span>• Method: <strong>{sub.paymentMethod || 'Manual'}</strong></span>
                            {sub.transactionId && (
                              <span>• TID/Ref: <strong className="font-mono text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{sub.transactionId}</strong></span>
                            )}
                            {sub.renewalDate && (
                              <span>• Renews: {new Date(sub.renewalDate).toLocaleDateString()}</span>
                            )}
                          </div>

                          {sub.providerReference && (
                            <p className="text-[10px] text-stone-500 font-mono">
                              Note: {sub.providerReference}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  Storage.verifySubscription(sub.id, 'APPROVE');
                                  confetti({ particleCount: 60, spread: 60 });
                                }}
                                className="px-3 py-1.5 rounded-full bg-[#003527] text-white font-bold text-xs hover:bg-[#064e3b] transition-colors cursor-pointer"
                              >
                                ✓ Verify & Activate
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const reason = window.prompt('Reason for rejection / refund note:');
                                  Storage.verifySubscription(sub.id, 'REJECT', reason || undefined);
                                }}
                                className="px-3 py-1.5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {isActive && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Active Verified
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PRICING PLANS MANAGER */}
          {activeTab === 'pricing' && (
            <div>
              <AdminPricingManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
