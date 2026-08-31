import React, { useState, useRef, useEffect } from 'react';
import { Link, useRouter, usePathname } from '../../lib/navigation';
import { useAuth } from '../../lib/authContext';
import { Storage, useStorageSubscription } from '../../lib/storage';
import {
  Search,
  MapPin,
  MessageSquare,
  Bell,
  ChevronDown,
  PlusCircle,
  Store,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Heart,
  Bookmark,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export function Navbar() {
  useStorageSubscription();
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cityMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  const cities = Storage.getCities();
  const notifications = user ? Storage.getNotifications(user.id) : [];
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Unread messages count for this user
  const conversations = Storage.getConversations().filter((conversation) => {
    if (!user) return false;
    if (role === 'SELLER') {
      return conversation.vendorId === user.sellerProfileId || conversation.vendorId === user.id;
    }
    if (role === 'ADMIN') {
      return true;
    }
    return conversation.customerId === user.id;
  });

  const unreadMessagesCount = user
    ? conversations.reduce((acc, c) => {
      if (role === 'SELLER' && (c.vendorId === user.sellerProfileId || c.vendorId === user.id)) {
        return acc + (c.unreadCountVendor || 0);
      }
      if (c.customerId === user.id) {
        return acc + (c.unreadCountCustomer || 0);
      }
      return acc;
    }, 0)
    : 0;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (cityMenuRef.current && !cityMenuRef.current.contains(target)) {
        setCityMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setNotifMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      const isClickOnMobileToggle = mobileToggleRef.current && mobileToggleRef.current.contains(target);
      const isClickInsideMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(target);

      if (!isClickOnMobileToggle && !isClickInsideMobileMenu) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(selectedCity)}`);
    } else {
      router.push(`/search?city=${encodeURIComponent(selectedCity)}`);
    }
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setCityMenuOpen(false);
    if (pathname === '/search') {
      router.push(`/search?city=${encodeURIComponent(cityName)}`);
    }
  };

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'SELLER') return '/seller/dashboard';
    return '/customer/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e3e2e1] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-16 sm:h-18">
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#003527] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <span className="font-bold text-sm sm:text-lg font-['Plus_Jakarta_Sans'] tracking-tight">HB</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg tracking-tight text-[#003527] leading-none font-['Plus_Jakarta_Sans']">
                  HomeBiz
                </span>
                <span className="text-[10px] text-[#665d55] tracking-widest font-medium uppercase mt-0.5">
                  Pakistan • Australia
                </span>
              </div>
            </Link>

            <div className="relative hidden sm:block" ref={cityMenuRef}>
              <button
                type="button"
                onClick={() => setCityMenuOpen(!cityMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f3f2] hover:bg-[#eeeeed] text-xs font-semibold text-[#1a1c1c] border border-[#e3e2e1] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#003527]" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-[#665d55]" />
              </button>

              {cityMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#e3e2e1] py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[#665d55] uppercase tracking-wider">
                    Select Your City
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city.name)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#f4f3f2] transition-colors ${selectedCity === city.name ? 'font-bold text-[#003527] bg-[#f4f3f2]' : 'text-[#1a1c1c]'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#665d55]" />
                        {city.name}
                      </span>
                      <span className="text-[10px] text-[#665d55] bg-white px-2 py-0.5 rounded-full border border-[#e3e2e1]">
                        {city.vendorCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden min-[821px]:flex flex-1 max-w-md mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search cakes, bridal mehndi, tiffins, tailors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm bg-[#f4f3f2] focus:bg-white border border-transparent focus:border-[#003527] rounded-full outline-none transition-all placeholder:text-[#665d55]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665d55]" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#003527] text-white text-xs font-semibold rounded-full hover:bg-[#064e3b] transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden min-[821px]:flex items-center gap-5 text-xs font-semibold text-[#1a1c1c]">
              <Link href="/explore" className="hover:text-[#003527] transition-colors">
                Explore
              </Link>
              <Link href="/categories" className="hover:text-[#003527] transition-colors">
                Categories
              </Link>
              <Link href="/how-it-works" className="hover:text-[#003527] transition-colors">
                How It Works
              </Link>
            </nav>

            <Link
              href="/request"
              className={mobileMenuOpen ? 'hidden' : 'hidden min-[821px]:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FFF1E7] hover:bg-[#fee5d4] text-[#735c00] border border-[#ffe088]/60 text-xs font-bold transition-all shadow-xs'}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#cca72f]" />
              <span>Post Request</span>
            </Link>

            {user ? (
              <>
                <Link
                  href={role === 'SELLER' ? '/seller/dashboard/messages' : '/customer/dashboard/messages'}
                  className={mobileMenuOpen ? 'hidden' : 'hidden min-[821px]:flex relative p-2 text-[#1a1c1c] hover:bg-[#f4f3f2] rounded-full transition-colors'}
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5 text-[#404944]" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#ba1a1a] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>

                <div className="hidden min-[821px]:block relative" ref={notifMenuRef}>
                  <button
                    type="button"
                    onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                    className="relative p-2 text-[#1a1c1c] hover:bg-[#f4f3f2] rounded-full transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 text-[#404944]" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {notifMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e3e2e1] py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 flex items-center justify-between border-b border-[#e3e2e1]">
                        <span className="font-bold text-xs text-[#1a1c1c]">Notifications</span>
                        {unreadNotifs > 0 && user && (
                          <button
                            onClick={() => Storage.markAllNotificationsAsRead(user.id)}
                            className="text-[11px] text-[#003527] font-semibold hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-[#f4f3f2] custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-[#665d55]">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 5).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                Storage.markNotificationAsRead(notif.id);
                                if (notif.link) router.push(notif.link);
                                setNotifMenuOpen(false);
                              }}
                              className={`p-3.5 text-xs hover:bg-[#f4f3f2] cursor-pointer transition-colors ${!notif.read ? 'bg-[#f4f3f2]/60 font-medium' : ''
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-[#1a1c1c]">{notif.title}</span>
                                {!notif.read && <span className="w-2 h-2 rounded-full bg-[#003527] flex-shrink-0 mt-1" />}
                              </div>
                              <p className="text-[#404944] text-[11px] mt-1 line-clamp-2">{notif.message}</p>
                              <span className="text-[10px] text-[#665d55] mt-1.5 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden min-[821px]:block relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-[#f4f3f2] transition-colors focus:outline-none"
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003527&color=fff&size=200`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#95d3ba]"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-[#665d55] hidden sm:inline" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e3e2e1] py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-[#e3e2e1]">
                        <p className="font-bold text-xs text-[#1a1c1c] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#665d55] truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#95d3ba]/30 text-[#003527] font-bold">
                          {role} Account
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href={getDashboardLink()}
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#1a1c1c] hover:bg-[#f4f3f2] font-semibold"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#003527]" />
                          <span>{role === 'ADMIN' ? 'Admin Panel' : role === 'SELLER' ? 'Seller Hub' : 'My Dashboard'}</span>
                        </Link>

                        {role === 'CUSTOMER' && (
                          <>
                            <Link
                              href="/customer/dashboard/bookings"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#404944] hover:bg-[#f4f3f2]"
                            >
                              <Calendar className="w-4 h-4 text-[#665d55]" />
                              <span>My Bookings</span>
                            </Link>
                            <Link
                              href="/customer/dashboard/favorites"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#404944] hover:bg-[#f4f3f2]"
                            >
                              <Heart className="w-4 h-4 text-[#665d55]" />
                              <span>Saved Businesses</span>
                            </Link>
                            <Link
                              href="/become-a-seller"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#003527] hover:bg-emerald-50 font-bold"
                            >
                              <Store className="w-4 h-4 text-[#003527]" />
                              <span>Become a Seller</span>
                            </Link>
                          </>
                        )}

                        {role === 'SELLER' && (
                          <>
                            <Link
                              href="/seller/dashboard/services"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#404944] hover:bg-[#f4f3f2]"
                            >
                              <Sparkles className="w-4 h-4 text-[#665d55]" />
                              <span>Manage Services</span>
                            </Link>
                            <Link
                              href="/seller/dashboard/bookings"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#404944] hover:bg-[#f4f3f2]"
                            >
                              <Calendar className="w-4 h-4 text-[#665d55]" />
                              <span>Customer Orders</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-[#e3e2e1] pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                            router.push('/auth/login');
                          }}
                          className="w-full px-4 py-2 text-xs flex items-center gap-2.5 text-[#ba1a1a] hover:bg-red-50 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden min-[821px]:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-[#003527] hover:bg-[#f4f3f2] rounded-full transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#003527] hover:bg-[#064e3b] rounded-full transition-colors shadow-xs"
                >
                  Join / Register
                </Link>
              </div>
            )}

            <button
              ref={mobileToggleRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex min-[821px]:hidden items-center justify-center w-10 h-10 rounded-full border border-[#e3e2e1] bg-[#f4f3f2] text-[#003527] transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="relative block w-5 h-4">
                <span
                  className={`absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-[#003527] transition-transform duration-200 ${mobileMenuOpen ? 'translate-y-1.5 rotate-45' : ''
                    }`}
                />
                <span
                  className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-[#003527] transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                />
                <span
                  className={`absolute left-0 bottom-0 block h-0.5 w-5 rounded-full bg-[#003527] transition-transform duration-200 ${mobileMenuOpen ? '-translate-y-1.5 -rotate-45' : ''
                    }`}
                />
              </span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="min-[821px]:hidden animate-fade-in border-t border-[#e3e2e1] bg-white/95 backdrop-blur-sm">
            <div className="px-3 py-3 space-y-4">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search local services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#f4f3f2] border border-transparent focus:border-[#003527] rounded-full outline-none transition-all placeholder:text-[#665d55]"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665d55]" />
              </form>

              <div className="space-y-1.5">
                <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]">
                  Explore
                </Link>
                <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]">
                  Categories
                </Link>
                <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]">
                  How It Works
                </Link>
                <Link href="/request" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#735c00] bg-[#FFF1E7] border border-[#ffe088]/60">
                  Post Request
                </Link>
              </div>

              <div className="border-t border-[#e3e2e1] pt-3">
                {user ? (
                  <div className="space-y-1.5">
                    <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]">
                      <LayoutDashboard className="w-4 h-4 text-[#003527]" />
                      Dashboard
                    </Link>
                    <Link href={role === 'SELLER' ? '/seller/dashboard/messages' : '/customer/dashboard/messages'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]">
                      <MessageSquare className="w-4 h-4 text-[#404944]" />
                      Messages
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                        router.push('/auth/login');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#ba1a1a] hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#003527] bg-[#f4f3f2] text-center">
                      Sign In
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#003527] text-center">
                      Join / Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
