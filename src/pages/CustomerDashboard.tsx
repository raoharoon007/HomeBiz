import React, { useState, useRef } from 'react';
import { usePathname, Link, useRouter } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { ChatWindow } from '../components/marketplace/ChatWindow';
import { VendorCard } from '../components/marketplace/VendorCard';
import { AddReviewModal } from '../components/marketplace/AddReviewModal';
import {
  Calendar,
  FileText,
  MessageSquare,
  Heart,
  Settings,
  Star,
  Clock,
  MapPin,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Camera,
  Save,
  AlertCircle,
} from 'lucide-react';
import { uploadImageToStorage } from '../lib/supabaseStorage';
import { validateForm, profileSettingsSchema } from '../lib/validationSchemas';

export function CustomerDashboard() {
  useStorageSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || 'Lahore',
    address: user?.address || '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  // Profile picture handler with Supabase Storage
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadImageToStorage(file, 'avatars');
      setAvatarPreview(publicUrl);
      await updateProfile({ avatar: publicUrl });
    } catch (err) {
      console.warn('Avatar upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Settings save handler
  const handleSettingsSave = async () => {
    const payload = {
      name: settingsForm.name.trim() || (user?.name ?? ''),
      phone: settingsForm.phone.trim(),
      city: settingsForm.city.trim() || (user?.city ?? 'Lahore'),
      address: settingsForm.address.trim(),
    };

    // Yup validation
    const { isValid, errors } = await validateForm(profileSettingsSchema, payload);
    if (!isValid) {
      setSettingsErrors(errors);
      return;
    }
    setSettingsErrors({});

    updateProfile(payload);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Determine active tab
  let activeTab = 'bookings';
  if (pathname.includes('/requests')) activeTab = 'requests';
  else if (pathname.includes('/messages')) activeTab = 'messages';
  else if (pathname.includes('/favorites')) activeTab = 'favorites';
  else if (pathname.includes('/settings')) activeTab = 'settings';

  const [reviewModalState, setReviewModalState] = useState<{
    open: boolean;
    vendorId: string;
    vendorName: string;
    bookingId?: string;
  }>({
    open: false,
    vendorId: '',
    vendorName: '',
  });

  const customerConversations = user
    ? Storage.getConversations().filter((c) => c.customerId === user.id || Boolean(c.participants?.some((p) => p.id === user.id)))
    : [];
  const unreadCustomerMessages = customerConversations.reduce((acc, c) => acc + (c.unreadCountCustomer || 0), 0);

  const handleChatWithVendor = (vendorId: string, vendorName: string, bookingRef?: string) => {
    if (!user) return;
    const conv = Storage.getOrCreateConversation(user.id, vendorId, {
      type: 'BOOKING',
      id: bookingRef || vendorId,
      title: bookingRef ? `Order #${bookingRef}` : `Order with ${vendorName}`,
    });
    router.push(`/customer/dashboard/messages?convId=${conv.id}`);
  };

  const navTabs = [
    { id: 'bookings', label: 'My Bookings', path: '/customer/dashboard/bookings', icon: Calendar, badge: user ? Storage.getBookings().filter((b) => b.customerId === user.id).length : 0 },
    { id: 'requests', label: 'My Custom Requests', path: '/customer/dashboard/requests', icon: FileText, badge: user ? Storage.getRequests().filter((r) => r.customerId === user.id).length : 0 },
    { id: 'messages', label: 'Messages', path: '/customer/dashboard/messages', icon: MessageSquare, badge: unreadCustomerMessages > 0 ? unreadCustomerMessages : undefined },
    { id: 'favorites', label: 'Saved Creators', path: '/customer/dashboard/favorites', icon: Heart, badge: user ? Storage.getFavorites(user.id).length : 0 },
    { id: 'settings', label: 'Profile Settings', path: '/customer/dashboard/settings', icon: Settings },
  ];

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#1a1c1c]">Sign In Required</h2>
        <p className="text-xs text-[#665d55]">Please sign in to view your bookings, requests, and account settings.</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/auth/login" className="px-6 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]">
            Sign In
          </Link>
          <Link href="/auth/register" className="px-6 py-2.5 rounded-full bg-[#faf9f8] border border-[#e3e2e1] text-[#003527] text-xs font-bold hover:bg-[#f4f3f2]">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const bookings = Storage.getBookings().filter((b) => b.customerId === user.id);
  const requests = Storage.getRequests().filter((r) => r.customerId === user.id);
  const userFavorites = Storage.getFavorites(user.id);
  const favoriteVendors = Storage.getVendors().filter((v) => userFavorites.some((f) => f.vendorId === v.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Customer Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <img
              src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003527&color=fff&size=200`}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#003527]"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                {user.name}
              </h1>
              <span className="text-[10px] bg-[#b0f0d6]/40 text-[#003527] px-2 py-0.5 rounded-full font-bold">
                Customer Account
              </span>
            </div>
            <p className="text-xs text-[#665d55]">
              {user.email} • {user.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/request"
            className="px-4 py-2 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#ffe088]" />
            <span>Post New Request</span>
          </Link>
        </div>
      </div>

      {/* Main Layout: Tabs + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Tabs Navigation */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-3 border border-[#e3e2e1] shadow-xs space-y-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                  isSelected
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
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-white text-[#003527]' : 'bg-[#f4f3f2] text-[#404944]'
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
          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1a1c1c]">Order History & Active Bookings</h2>
                <span className="text-xs text-[#665d55]">{bookings.length} Total Bookings</span>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e3e2e1] space-y-3">
                  <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                  <h3 className="font-bold text-sm text-[#1a1c1c]">No Bookings Yet</h3>
                  <p className="text-xs text-[#665d55]">Explore local home businesses and place your first order!</p>
                  <Link
                    href="/explore"
                    className="inline-block px-5 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs"
                  >
                    Explore Creators
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={booking.serviceImage}
                          alt={booking.serviceTitle}
                          className="w-16 h-16 rounded-2xl object-cover border border-[#e3e2e1] flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#665d55]">
                              #{booking.bookingNumber}
                            </span>
                            <span className="text-[10px] bg-[#b0f0d6]/40 text-[#003527] px-2 py-0.5 rounded-full font-bold">
                              {booking.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#1a1c1c]">{booking.serviceTitle}</h3>
                          <Link
                            href={`/vendors/${booking.vendorSlug}`}
                            className="text-xs text-[#003527] font-semibold hover:underline block"
                          >
                            {booking.vendorName}
                          </Link>
                          <div className="flex items-center gap-3 text-[11px] text-[#665d55] pt-0.5">
                            <span>📅 {booking.date}</span>
                            <span>•</span>
                            <span>⏰ {booking.timeSlot}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f4f3f2]">
                        <span className="text-base font-black text-[#003527]">
                          Rs. {booking.total.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setReviewModalState({
                                open: true,
                                vendorId: booking.vendorId,
                                vendorName: booking.vendorName,
                                bookingId: booking.id,
                              })
                            }
                            className="px-3 py-1.5 rounded-full border border-[#cca72f] text-[#735c00] hover:bg-[#FFF1E7] text-xs font-bold flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5 fill-[#cca72f]" />
                            <span>Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChatWithVendor(booking.vendorId, booking.vendorName, booking.bookingNumber)}
                            className="px-3 py-1.5 rounded-full bg-[#003527] text-white hover:bg-[#064e3b] text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS & QUOTES */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1a1c1c]">Custom Broadcast Requests</h2>
                <Link
                  href="/request"
                  className="text-xs font-bold text-[#003527] hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post Another Request</span>
                </Link>
              </div>

              {requests.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e3e2e1] space-y-3">
                  <FileText className="w-10 h-10 text-stone-300 mx-auto" />
                  <h3 className="font-bold text-sm text-[#1a1c1c]">No Broadcast Requests</h3>
                  <p className="text-xs text-[#665d55]">Need custom cakes, tailoring, or catering? Post a free request!</p>
                  <Link
                    href="/request"
                    className="inline-block px-5 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs"
                  >
                    Post Custom Request
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => {
                    const quotes = Storage.getQuotesForRequest(req.id);
                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-3xl p-5 border border-[#e3e2e1] shadow-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-[#665d55]">
                              #{req.requestNumber} • {req.city}
                            </span>
                            <h3 className="font-bold text-sm text-[#1a1c1c]">{req.serviceNeeded}</h3>
                          </div>
                          <span className="text-xs font-extrabold text-[#003527] bg-[#b0f0d6]/30 px-3 py-1 rounded-full">
                            Budget: Rs. {req.budget.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-[#404944] leading-relaxed line-clamp-2">
                          {req.description}
                        </p>

                        <div className="pt-2 border-t border-[#f4f3f2] flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#665d55]">
                            💬 <strong>{quotes.length} Quotes Received</strong>
                          </span>

                          <Link
                            href={`/quotes/${req.id}`}
                            className="px-4 py-2 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                          >
                            <span>Compare Quotes</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <ChatWindow />
            </div>
          )}

          {/* TAB 4: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[#1a1c1c]">Saved Favorite Creators ({favoriteVendors.length})</h2>
              {favoriteVendors.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e3e2e1] text-xs text-[#665d55]">
                  You haven't saved any creators yet. Click the heart icon on any profile to bookmark them!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favoriteVendors.map((v) => (
                    <VendorCard key={v.id} vendor={v} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6">
              <h2 className="text-base font-bold text-[#1a1c1c]">Account &amp; Delivery Preferences</h2>

              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-gradient-to-br from-[#f0fdf6] to-[#faf9f8] rounded-2xl border border-[#b0f0d6]/40">
                <div className="relative">
                  <img
                    src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003527&color=fff&size=200`}
                    alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#003527] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#003527] text-white flex items-center justify-center shadow-md hover:bg-[#064e3b] transition-colors"
                    title="Change profile picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1a1c1c] mb-0.5">Profile Picture</p>
                  <p className="text-xs text-[#665d55] mb-3">Upload a photo from your device. JPG, PNG, or WebP recommended.</p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 rounded-full border border-[#003527] text-[#003527] font-bold text-xs hover:bg-[#003527] hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Choose New Photo
                  </button>
                  {avatarPreview && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Photo updated! Save changes below.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder={user.name}
                    value={settingsForm.name}
                    onChange={(e) => {
                      setSettingsForm((p) => ({ ...p, name: e.target.value }));
                      if (settingsErrors.name) setSettingsErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                      settingsErrors.name
                        ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                        : 'border-[#e3e2e1] focus:border-[#003527]'
                    }`}
                  />
                  {settingsErrors.name && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {settingsErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    disabled
                    className="w-full text-xs p-3 bg-[#f0f0f0] border border-[#e3e2e1] rounded-2xl outline-none cursor-not-allowed opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="tel"
                    placeholder={user.phone || '03XX-XXXXXXX'}
                    value={settingsForm.phone}
                    onChange={(e) => {
                      setSettingsForm((p) => ({ ...p, phone: e.target.value }));
                      if (settingsErrors.phone) setSettingsErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                      settingsErrors.phone
                        ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                        : 'border-[#e3e2e1] focus:border-[#003527]'
                    }`}
                  />
                  {settingsErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {settingsErrors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder={user.city}
                    value={settingsForm.city}
                    onChange={(e) => {
                      setSettingsForm((p) => ({ ...p, city: e.target.value }));
                      if (settingsErrors.city) setSettingsErrors(prev => ({ ...prev, city: '' }));
                    }}
                    className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                      settingsErrors.city
                        ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                        : 'border-[#e3e2e1] focus:border-[#003527]'
                    }`}
                  />
                  {settingsErrors.city && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {settingsErrors.city}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Default Delivery Street Address
                </label>
                <input
                  type="text"
                  placeholder={user.address || 'Street, Area, City'}
                  value={settingsForm.address}
                  onChange={(e) => {
                    setSettingsForm((p) => ({ ...p, address: e.target.value }));
                    if (settingsErrors.address) setSettingsErrors(prev => ({ ...prev, address: '' }));
                  }}
                  className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                    settingsErrors.address
                      ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                      : 'border-[#e3e2e1] focus:border-[#003527]'
                  }`}
                />
                {settingsErrors.address && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {settingsErrors.address}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSettingsSave}
                  className="px-6 py-2.5 rounded-full bg-[#003527] text-white font-bold text-xs shadow-xs hover:bg-[#064e3b] flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
                {settingsSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Profile saved successfully!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <AddReviewModal
        vendorId={reviewModalState.vendorId}
        vendorName={reviewModalState.vendorName}
        bookingId={reviewModalState.bookingId}
        isOpen={reviewModalState.open}
        onClose={() => setReviewModalState({ open: false, vendorId: '', vendorName: '' })}
      />
    </div>
  );
}
