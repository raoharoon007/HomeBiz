import React, { useState, useRef } from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { ChatWindow } from '../components/marketplace/ChatWindow';
import { ServiceItem, ServiceAddon, Quote } from '../types';
import {
  LayoutDashboard,
  Store,
  MenuSquare,
  Calendar,
  FileSpreadsheet,
  MessageSquare,
  Star,
  Wallet,
  CheckCircle,
  Clock,
  PlusCircle,
  Sparkles,
  Send,
  Trash2,
  Edit,
  DollarSign,
  Check,
  UploadCloud,
  Loader,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { uploadImageToStorage } from '../lib/supabaseStorage';

export function SellerDashboard() {
  useStorageSubscription();
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#1a1c1c]">Sign In Required</h2>
        <p className="text-xs text-[#665d55]">Please sign in to access your seller hub, manage packages, and reply to customer inquiries.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/auth/login" className="px-6 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]">
            Sign In
          </Link>
          <Link href="/become-a-seller" className="px-6 py-2.5 rounded-full bg-[#faf9f8] border border-[#e3e2e1] text-[#003527] text-xs font-bold hover:bg-[#f4f3f2]">
            Become a Seller
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === 'CUSTOMER') {
    return (
      <div className="max-w-lg mx-auto my-16 text-center bg-white rounded-3xl p-8 sm:p-10 border border-[#e3e2e1] space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#FFF1E7] text-[#735c00] mx-auto flex items-center justify-center font-bold text-lg">
          👩‍🍳
        </div>
        <h2 className="text-xl font-bold text-[#1a1c1c]">Seller Hub Access</h2>
        <p className="text-xs text-[#665d55]">
          You are currently signed in as a **Customer** ({user.name}). To list your home business confections, tailoring, catering, or crafts on HomeBiz (Pakistan & Australia), set up your seller profile!
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/become-a-seller" className="px-6 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]">
            Become a Seller
          </Link>
          <Link href="/customer/dashboard/bookings" className="px-6 py-2.5 rounded-full bg-[#faf9f8] border border-[#e3e2e1] text-[#003527] text-xs font-bold hover:bg-[#f4f3f2]">
            Go to My Customer Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Find vendor profile
  const vendor =
    Storage.getVendors().find((v) => v.id === user.sellerProfileId || v.userId === user.id) ||
    Storage.getVendors()[0];

  // Tab detection
  let activeTab = 'overview';
  if (pathname.includes('/profile')) activeTab = 'profile';
  else if (pathname.includes('/services')) activeTab = 'services';
  else if (pathname.includes('/bookings')) activeTab = 'bookings';
  else if (pathname.includes('/requests')) activeTab = 'requests';
  else if (pathname.includes('/messages')) activeTab = 'messages';
  else if (pathname.includes('/reviews')) activeTab = 'reviews';
  else if (pathname.includes('/plan')) activeTab = 'plan';
  else if (pathname.includes('/earnings')) activeTab = 'earnings';

  // Vendor data
  const bookings = Storage.getBookings().filter((b) => b.vendorId === vendor.id);
  const reviews = Storage.getReviews(vendor.id);
  const broadcastRequests = Storage.getRequests().filter(
    (r) => r.category === vendor.category || r.city.toLowerCase() === vendor.city.toLowerCase()
  );

  // Quote creation modal state
  const [selectedReqForQuote, setSelectedReqForQuote] = useState<any | null>(null);
  const [quotePrice, setQuotePrice] = useState(12000);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteDeliveryFee, setQuoteDeliveryFee] = useState(500);
  const [quoteTime, setQuoteTime] = useState('2-3 business days');
  const [quoteBreakdown, setQuoteBreakdown] = useState<{ name: string; cost: number }[]>([
    { name: 'Core custom service & labor', cost: 10000 },
    { name: 'Premium ingredients / materials', cost: 2000 },
  ]);

  // Reply to review state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Add new service modal
  const [newServiceModal, setNewServiceModal] = useState(false);
  const [newSrvTitle, setNewSrvTitle] = useState('');
  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvPrice, setNewSrvPrice] = useState(5000);
  const [newSrvNotice, setNewSrvNotice] = useState('48 hours notice');
  const [newSrvImage, setNewSrvImage] = useState<string | null>(null);
  const [uploadingSrvImg, setUploadingSrvImg] = useState(false);
  const srvImgRef = useRef<HTMLInputElement>(null);

  const totalEarnings = bookings
    .filter((b) => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.total, 0);

  // Get current subscription
  const currentSubscription = Storage.getSubscriptionByVendorId(vendor.id);
  const currentPlan = vendor.currentPlan || 'free';
  const planData = Storage.getPricingPlanBySlug(currentPlan);

  const navTabs = [
    { id: 'overview', label: 'Overview', path: '/seller/dashboard/overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Storefront Profile', path: '/seller/dashboard/profile', icon: Store },
    { id: 'services', label: 'Services & Packages', path: '/seller/dashboard/services', icon: MenuSquare, badge: vendor.services.length },
    { id: 'bookings', label: 'Customer Orders', path: '/seller/dashboard/bookings', icon: Calendar, badge: bookings.length },
    { id: 'requests', label: 'Broadcast Inquiries', path: '/seller/dashboard/requests', icon: FileSpreadsheet, badge: broadcastRequests.length },
    { id: 'messages', label: 'Live Messages', path: '/seller/dashboard/messages', icon: MessageSquare },
    { id: 'reviews', label: 'Customer Reviews', path: '/seller/dashboard/reviews', icon: Star, badge: reviews.length },
    { id: 'plan', label: 'My Plan & Billing', path: '/seller/dashboard/plan', icon: DollarSign },
    { id: 'earnings', label: 'Earnings & Payouts', path: '/seller/dashboard/earnings', icon: Wallet },
  ];

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForQuote) return;

    const newQuote: Quote = {
      id: `q-${Date.now()}`,
      quoteNumber: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      requestId: selectedReqForQuote.id,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorAvatar: vendor.avatar,
      vendorRating: vendor.rating,
      vendorReviewCount: vendor.reviewCount,
      vendorSlug: vendor.slug,
      price: quotePrice,
      serviceFee: 0,
      deliveryFee: quoteDeliveryFee,
      totalPrice: quotePrice + quoteDeliveryFee,
      itemsBreakdown: quoteBreakdown,
      estimatedCompletion: quoteTime,
      message: quoteMessage,
      validUntil: '7 days',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    Storage.submitQuote(newQuote);
    setSelectedReqForQuote(null);
    confetti({ particleCount: 80, spread: 60 });
  };

  const handleReplyReview = (reviewId: string) => {
    if (!replyText.trim()) return;
    Storage.replyToReview(reviewId, replyText);
    setReplyingReviewId(null);
    setReplyText('');
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvTitle.trim()) return;

    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: newSrvTitle,
      description: newSrvDesc,
      price: newSrvPrice,
      category: vendor.category,
      image:
        newSrvImage ||
        vendor.coverImage ||
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
      noticePeriod: newSrvNotice,
      isPopular: false,
      addons: [],
    };

    Storage.addVendorService(vendor.id, newService);
    setNewServiceModal(false);
    setNewSrvTitle('');
    setNewSrvDesc('');
    setNewSrvImage(null);
    confetti({ particleCount: 50, spread: 50 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Seller Header */}
      <div className="bg-[#003527] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={vendor.avatar}
            alt={vendor.businessName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#b0f0d6] shadow-sm flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans']">
                {vendor.businessName}
              </h1>
              {vendor.verificationStatus === 'VERIFIED' ? (
                <span className="text-[10px] bg-[#b0f0d6] text-[#003527] px-2.5 py-0.5 rounded-full font-bold">
                  Verified Seller
                </span>
              ) : (
                <span className="text-[10px] bg-[#ffe088] text-[#735c00] px-2.5 py-0.5 rounded-full font-bold">
                  Verification Pending
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              {vendor.locality}, {vendor.city} • {vendor.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/vendors/${vendor.slug}`}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/30 transition-colors"
          >
            Preview Public Store
          </Link>
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

        {/* Right Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Total Revenue
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#003527] block">
                    Rs. {totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">95% net payout</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Total Orders
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#1a1c1c] block">
                    {bookings.length}
                  </span>
                  <span className="text-[10px] text-[#665d55]">Active & Completed</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Store Rating
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xl sm:text-2xl font-black text-[#cca72f]">
                      {vendor.rating.toFixed(1)}
                    </span>
                    <Star className="w-4 h-4 fill-[#cca72f] text-[#cca72f]" />
                  </div>
                  <span className="text-[10px] text-[#665d55]">{reviews.length} reviews</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#e3e2e1] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Inquiries
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#735c00] block">
                    {broadcastRequests.length}
                  </span>
                  <span className="text-[10px] text-[#cca72f] font-semibold">Live in your city</span>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#1a1c1c]">Recent Customer Bookings</h3>
                  <Link
                    href="/seller/dashboard/bookings"
                    className="text-xs font-bold text-[#003527] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#665d55]">No customer orders yet.</div>
                ) : (
                  <div className="divide-y divide-[#f4f3f2]">
                    {bookings.slice(0, 4).map((b) => (
                      <div key={b.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#1a1c1c] block">
                            {b.customerName} • {b.serviceTitle}
                          </span>
                          <span className="text-[10px] text-[#665d55]">
                            #{b.bookingNumber} • 📅 {b.date} ({b.timeSlot})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#003527] block">
                            Rs. {b.total.toLocaleString()}
                          </span>
                          <span className="text-[10px] bg-[#b0f0d6]/40 text-[#003527] px-2 py-0.5 rounded-full font-semibold">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE STOREFRONT */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6">
              <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Storefront & Brand Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    defaultValue={vendor.businessName}
                    className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    defaultValue={vendor.tagline}
                    className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  About the Business / Bio
                </label>
                <textarea
                  rows={4}
                  defaultValue={vendor.description}
                  className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    defaultValue={vendor.city}
                    className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Locality
                  </label>
                  <input
                    type="text"
                    defaultValue={vendor.locality}
                    className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Notice Period
                  </label>
                  <input
                    type="text"
                    defaultValue={vendor.availabilityNotice}
                    className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert('Profile updated successfully!')}
                className="px-6 py-3 rounded-full bg-[#003527] text-white font-bold text-xs shadow-xs hover:bg-[#064e3b]"
              >
                Save Storefront
              </button>
            </div>
          )}

          {/* TAB 3: SERVICES & PACKAGES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1a1c1c]">Menu Packages ({vendor.services.length})</h2>
                <button
                  onClick={() => setNewServiceModal(true)}
                  className="px-4 py-2 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#ffe088]" />
                  <span>Add New Package</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs space-y-3"
                  >
                    <img src={srv.image} alt={srv.title} className="w-full h-36 rounded-2xl object-cover" />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#1a1c1c]">{srv.title}</h3>
                        <p className="text-xs text-[#404944] line-clamp-2 mt-0.5">{srv.description}</p>
                      </div>
                      <span className="font-black text-sm text-[#003527]">
                        Rs. {srv.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f4f3f2] text-xs text-[#665d55]">
                      <span>Notice: {srv.noticePeriod}</span>
                      <span className="text-[#003527] font-semibold">{srv.addons?.length || 0} Add-ons</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER ORDERS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1a1c1c]">Customer Orders & Delivery Status</h2>

              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1a1c1c]">#{booking.bookingNumber}</span>
                        <span className="text-[10px] bg-[#b0f0d6]/40 text-[#003527] px-2 py-0.5 rounded-full font-bold">
                          {booking.status}
                        </span>
                        <span className="text-[10px] bg-[#f4f3f2] text-[#665d55] px-2 py-0.5 rounded-full">
                          {booking.paymentMethod}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1a1c1c]">{booking.serviceTitle}</h4>
                      <p className="text-xs text-[#404944]">
                        Customer: <strong>{booking.customerName}</strong> ({booking.customerPhone})
                      </p>
                      <p className="text-xs text-[#665d55]">
                        📍 {booking.deliveryAddress} • 📅 {booking.date} ({booking.timeSlot})
                      </p>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-base font-black text-[#003527]">
                        Rs. {booking.total.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {booking.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              Storage.updateBookingStatus(booking.id, 'COMPLETED');
                              confetti({ particleCount: 50 });
                            }}
                            className="px-3 py-1.5 rounded-full bg-[#003527] text-white text-xs font-bold hover:bg-[#064e3b]"
                          >
                            Mark Completed
                          </button>
                        )}
                        <Link
                          href="/seller/dashboard/messages"
                          className="px-3 py-1.5 rounded-full border border-stone-300 text-xs font-bold"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BROADCAST INQUIRIES & SEND QUOTES */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#1a1c1c]">
                  Live Broadcast Inquiries in {vendor.city}
                </h2>
                <p className="text-xs text-[#665d55]">Send itemized quotes to win custom orders.</p>
              </div>

              <div className="space-y-4">
                {broadcastRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#665d55]">#{req.requestNumber}</span>
                        <h3 className="font-bold text-sm text-[#1a1c1c]">{req.serviceNeeded}</h3>
                      </div>
                      <span className="text-xs font-black text-[#003527] bg-[#b0f0d6]/30 px-3 py-1 rounded-full">
                        Customer Budget: Rs. {req.budget.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#404944] leading-relaxed">{req.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#665d55]">
                      <span>📍 {req.area}, {req.city}</span>
                      <span>•</span>
                      <span>📅 Needed: {req.preferredDate}</span>
                      <span>•</span>
                      <span>👥 {req.guestCountOrQuantity}</span>
                    </div>

                    <div className="pt-2 border-t border-[#f4f3f2] flex items-center justify-between">
                      <span className="text-xs text-[#665d55]">{req.quoteCount} quotes submitted so far</span>
                      <button
                        onClick={() => {
                          setSelectedReqForQuote(req);
                          setQuotePrice(req.budget);
                          setQuoteMessage(
                            `Salam! We can prepare this bespoke order fresh using premium ingredients and deliver on ${req.preferredDate}.`
                          );
                        }}
                        className="px-4 py-2 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-[#ffe088]" />
                        <span>Send Itemized Quote</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <ChatWindow />
            </div>
          )}

          {/* TAB 7: REVIEWS & REPLIES */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1a1c1c]">Customer Reviews & Store Ratings</h2>
                <span className="text-xs font-bold text-[#cca72f]">
                  ★ {vendor.rating.toFixed(2)} ({reviews.length} reviews)
                </span>
              </div>

              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.customerAvatar}
                          alt={rev.customerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-bold text-xs text-[#1a1c1c]">{rev.customerName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#cca72f]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#cca72f]" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#404944]">{rev.comment}</p>

                    {rev.sellerReply ? (
                      <div className="ml-4 p-3 bg-[#faf9f8] rounded-xl border-l-4 border-[#003527] text-xs">
                        <span className="font-bold text-[#003527] text-[11px] block">Your Public Reply:</span>
                        <p className="text-[#404944] text-[11px] mt-0.5 italic">"{rev.sellerReply.text}"</p>
                      </div>
                    ) : replyingReviewId === rev.id ? (
                      <div className="space-y-2 pt-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Thank customer and mention special care taken..."
                          className="w-full text-xs p-2.5 bg-[#faf9f8] border border-[#e3e2e1] rounded-xl outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setReplyingReviewId(null)}
                            className="px-3 py-1 rounded-full text-xs font-bold text-stone-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReplyReview(rev.id)}
                            className="px-4 py-1.5 rounded-full bg-[#003527] text-white text-xs font-bold"
                          >
                            Publish Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingReviewId(rev.id)}
                        className="text-xs font-bold text-[#003527] hover:underline"
                      >
                        + Reply to this review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: MY PLAN & BILLING */}
          {activeTab === 'plan' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6">
              <div className="space-y-2 pb-4 border-b border-[#f4f3f2]">
                <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                  My Subscription Plan
                </h2>
                <p className="text-xs text-[#665d55]">Manage your pricing tier and billing information</p>
              </div>

              {/* Current Plan Card */}
              <div className={`p-6 rounded-2xl border-2 ${currentPlan === 'featured' ? 'bg-[#FFF1E7] border-[#cca72f]' : currentPlan === 'pro' ? 'bg-[#b0f0d6]/20 border-[#003527]' : 'bg-[#faf9f8] border-[#e3e2e1]'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl mb-2">
                      {currentPlan === 'featured' ? '👑' : currentPlan === 'pro' ? '⚡' : '🟢'}
                    </div>
                    <h3 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] capitalize">
                      {currentPlan} Plan
                    </h3>
                    <p className="text-xs text-[#665d55] mt-1">
                      Active until {currentSubscription?.renewalDate ? new Date(currentSubscription.renewalDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {currentPlan !== 'featured' && (
                    <Link
                      href="/pricing"
                      className="px-4 py-2 rounded-full bg-[#003527] text-white font-bold text-xs hover:bg-[#064e3b] transition-colors cursor-pointer"
                    >
                      Upgrade Plan
                    </Link>
                  )}
                </div>

                {planData && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-current border-opacity-10">
                    <p className="text-xs font-bold text-[#1a1c1c]">Current Plan Features:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {planData.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-[#003527] flex-shrink-0 mt-1" />
                          <span className="text-xs text-[#404944]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Information */}
              <div className="space-y-4 pt-4 border-t border-[#f4f3f2]">
                <h3 className="font-bold text-sm text-[#1a1c1c]">Billing Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1]">
                    <span className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider block">
                      Monthly Price
                    </span>
                    <span className="text-lg font-black text-[#003527] block mt-1">
                      {currentSubscription?.priceAtPurchase === 0 ? 'Free' : `PKR ${currentSubscription?.priceAtPurchase.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="p-4 bg-[#b0f0d6]/20 rounded-2xl border border-[#95d3ba]/40">
                    <span className="text-[10px] font-bold text-[#003527] uppercase tracking-wider block">
                      Billing Period
                    </span>
                    <span className="text-lg font-black text-[#003527] block mt-1 capitalize">
                      {currentSubscription?.billingPeriod || 'Monthly'}
                    </span>
                  </div>

                  <div className="p-4 bg-[#FFF1E7] rounded-2xl border border-[#ffe088]">
                    <span className="text-[10px] font-bold text-[#735c00] uppercase tracking-wider block">
                      Payment Status
                    </span>
                    <span className="text-lg font-black text-[#735c00] block mt-1 capitalize">
                      {currentSubscription?.paymentStatus || 'Active'} ✓
                    </span>
                  </div>
                </div>

                {currentSubscription && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                        Auto-Renewal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={currentSubscription.autoRenew}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs text-[#665d55]">
                          Automatically renew on {new Date(currentSubscription.renewalDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-6 py-2.5 rounded-full bg-[#003527] text-white font-bold text-xs hover:bg-[#064e3b] transition-colors cursor-pointer"
                    >
                      Update Billing Settings
                    </button>
                  </>
                )}
              </div>

              {/* Plan Comparison */}
              <div className="space-y-4 pt-4 border-t border-[#f4f3f2]">
                <h3 className="font-bold text-sm text-[#1a1c1c]">Compare Plans</h3>
                <p className="text-xs text-[#665d55]">
                  {currentPlan === 'free' && 'Upgrade to Pro to unlock priority ranking, unlimited galleries, and customer reviews.'}
                  {currentPlan === 'pro' && 'Upgrade to Featured for homepage listing, top search results, and priority support.'}
                  {currentPlan === 'featured' && 'You have our highest tier plan with maximum visibility and priority support.'}
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/pricing"
                    className="px-4 py-2 rounded-full bg-[#f4f3f2] text-[#003527] font-bold text-xs hover:bg-[#e3e2e1] transition-colors cursor-pointer border border-[#e3e2e1]"
                  >
                    View All Plans
                  </Link>
                  {currentPlan !== 'featured' && (
                    <Link
                      href="/pricing"
                      className="px-4 py-2 rounded-full bg-[#003527] text-white font-bold text-xs hover:bg-[#064e3b] transition-colors cursor-pointer"
                    >
                      Upgrade Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: EARNINGS & PAYOUTS */}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6">
              <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Earnings & Bank Payout Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#b0f0d6]/20 rounded-2xl border border-[#95d3ba]/40">
                  <span className="text-[10px] font-bold text-[#003527] uppercase tracking-wider block">
                    Gross Order Volume
                  </span>
                  <span className="text-xl font-black text-[#003527] block mt-1">
                    Rs. {totalEarnings.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1]">
                  <span className="text-[10px] font-bold text-[#665d55] uppercase tracking-wider block">
                    Platform Commission (5%)
                  </span>
                  <span className="text-xl font-black text-[#735c00] block mt-1">
                    Rs. {Math.round(totalEarnings * 0.05).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-[#FFF1E7] rounded-2xl border border-[#ffe088]">
                  <span className="text-[10px] font-bold text-[#735c00] uppercase tracking-wider block">
                    Net Withdrawable (95%)
                  </span>
                  <span className="text-xl font-black text-[#003527] block mt-1">
                    Rs. {Math.round(totalEarnings * 0.95).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#f4f3f2]">
                <h3 className="font-bold text-sm text-[#1a1c1c]">Payout Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                      Bank Name / JazzCash / Easypaisa
                    </label>
                    <input
                      type="text"
                      defaultValue="Meezan Bank Ltd"
                      className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      defaultValue={vendor.businessName}
                      className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                      IBAN / Mobile Account Number
                    </label>
                    <input
                      type="text"
                      defaultValue="PK92MEZN0001234567890101"
                      className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Payout settings saved!')}
                  className="px-6 py-2.5 rounded-full bg-[#003527] text-white font-bold text-xs shadow-xs hover:bg-[#064e3b]"
                >
                  Update Payout Credentials
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ITEMIZE & SEND QUOTE */}
      {selectedReqForQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e3e2e1] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#f4f3f2]">
              <div>
                <span className="text-[10px] font-bold text-[#cca72f] uppercase tracking-wider">
                  Create Itemized Quote
                </span>
                <h3 className="font-bold text-base text-[#1a1c1c]">
                  {selectedReqForQuote.serviceNeeded}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForQuote(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Personalized Pitch & Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Service Quote (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value))}
                    className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl font-bold text-[#003527] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Doorstep Delivery Fee (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={quoteDeliveryFee}
                    onChange={(e) => setQuoteDeliveryFee(Number(e.target.value))}
                    className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl font-bold text-[#003527] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Estimated Completion & Handover Time
                </label>
                <input
                  type="text"
                  required
                  value={quoteTime}
                  onChange={(e) => setQuoteTime(e.target.value)}
                  placeholder="e.g. 24-48 hours notice / Ready on Friday 4 PM"
                  className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                />
              </div>

              <div className="p-3 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1] flex items-center justify-between">
                <span className="font-bold text-[#1a1c1c]">Total Customer Pays:</span>
                <span className="font-black text-sm text-[#003527]">
                  Rs. {(quotePrice + quoteDeliveryFee).toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-[#ffe088]" />
                <span>Submit Itemized Quote to Customer</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SERVICE */}
      {newServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e3e2e1] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f4f3f2]">
              <h3 className="font-bold text-base text-[#1a1c1c]">Add New Service Package</h3>
              <button onClick={() => setNewServiceModal(false)} className="text-stone-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Package Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2-Pound Korean Bento Cake"
                  value={newSrvTitle}
                  onChange={(e) => setNewSrvTitle(e.target.value)}
                  className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details of flavor, portions, presentation..."
                  value={newSrvDesc}
                  onChange={(e) => setNewSrvDesc(e.target.value)}
                  className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={newSrvPrice}
                    onChange={(e) => setNewSrvPrice(Number(e.target.value))}
                    className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none font-bold text-[#003527]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Notice Required
                  </label>
                  <input
                    type="text"
                    required
                    value={newSrvNotice}
                    onChange={(e) => setNewSrvNotice(e.target.value)}
                    className="w-full p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl outline-none"
                  />
                </div>
              </div>

              {/* Service Image Upload */}
              <div>
                <label className="block font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                  Service Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={srvImgRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingSrvImg(true);
                    try {
                      const url = await uploadImageToStorage(file, 'services');
                      setNewSrvImage(url);
                    } catch (err) {
                      console.warn('Service image upload error:', err);
                    } finally {
                      setUploadingSrvImg(false);
                      if (srvImgRef.current) srvImgRef.current.value = '';
                    }
                  }}
                />
                <div className="flex items-center gap-3">
                  {newSrvImage && (
                    <img
                      src={newSrvImage}
                      alt="Service preview"
                      className="w-20 h-20 rounded-xl object-cover border border-[#e3e2e1]"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => srvImgRef.current?.click()}
                    disabled={uploadingSrvImg}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#003527] text-stone-500 hover:text-[#003527] text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    {uploadingSrvImg ? <Loader className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    {newSrvImage ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold shadow-md"
              >
                Add to Storefront
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
