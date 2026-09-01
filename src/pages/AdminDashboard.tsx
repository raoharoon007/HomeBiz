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
  else if (pathname.includes('/categories')) activeTab = 'categories';
  else if (pathname.includes('/cities')) activeTab = 'cities';
  else if (pathname.includes('/bookings')) activeTab = 'bookings';

  const vendors = Storage.getVendors();
  const bookings = Storage.getBookings();
  const categories = Storage.getCategories();
  const cities = Storage.getCities();
  const requests = Storage.getRequests();

  const totalGMV = bookings.reduce((sum, b) => sum + b.total, 0);
  const platformRevenue = Math.round(totalGMV * 0.05);

  const pendingVendors = vendors.filter((v) => v.verificationStatus === 'PENDING');
  const verifiedVendors = vendors.filter((v) => v.verificationStatus === 'VERIFIED');

  const navTabs = [
    { id: 'overview', label: 'Platform KPIs', path: '/admin/dashboard/overview', icon: TrendingUp },
    { id: 'vendors', label: 'Vendor Verifications', path: '/admin/dashboard/vendors', icon: Store, badge: pendingVendors.length },
    { id: 'categories', label: 'Categories', path: '/admin/dashboard/categories', icon: Layers, badge: categories.length },
    { id: 'cities', label: 'Active Cities', path: '/admin/dashboard/cities', icon: MapPin, badge: cities.length },
    { id: 'bookings', label: 'All Platform Orders', path: '/admin/dashboard/bookings', icon: Calendar, badge: bookings.length },
  ];

  const handleVerifyVendor = (vendorId: string) => {
    Storage.updateVendorVerification(vendorId, 'VERIFIED');
    confetti({ particleCount: 70, spread: 60 });
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
                <h3 className="font-bold text-sm text-[#1a1c1c]">Verified Home Businesses - Pakistan & Australia</h3>
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
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1a1c1c]">
                Merchant Verification Queue ({pendingVendors.length} Pending)
              </h2>

              <div className="space-y-4">
                {vendors.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={v.avatar}
                        alt={v.businessName}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#e3e2e1] flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#1a1c1c]">{v.businessName}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v.verificationStatus === 'VERIFIED'
                                ? 'bg-[#b0f0d6]/40 text-[#003527]'
                                : 'bg-[#ffe088] text-[#735c00]'
                              }`}
                          >
                            {v.verificationStatus}
                          </span>
                          {v.isFeatured && (
                            <span className="text-[10px] bg-[#003527] text-white px-2 py-0.5 rounded-full font-bold">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#665d55]">
                          📍 {v.locality}, {v.city} • Category: {v.category}
                        </p>
                        <p className="text-xs text-[#404944] mt-1 line-clamp-1">{v.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFeatured(v.id)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${v.isFeatured
                            ? 'bg-[#ffe088] text-[#735c00] border-[#ffe088]'
                            : 'bg-white text-stone-600 border-stone-300'
                          }`}
                      >
                        {v.isFeatured ? '★ Featured' : 'Feature'}
                      </button>

                      {v.verificationStatus !== 'VERIFIED' ? (
                        <button
                          onClick={() => handleVerifyVendor(v.id)}
                          className="px-4 py-1.5 rounded-full bg-[#003527] text-white text-xs font-bold hover:bg-[#064e3b] shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-[#b0f0d6]" />
                          <span>Approve & Verify</span>
                        </button>
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
                ))}
              </div>
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
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-[#003527] block">
                        Rs. {b.total.toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-[#b0f0d6]/40 text-[#003527] px-2 py-0.5 rounded-full font-bold">
                        {b.status} ({b.paymentMethod})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
