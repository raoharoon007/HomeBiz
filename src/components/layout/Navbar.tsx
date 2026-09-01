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
  LayoutDashboard,
  LogOut,
  Sparkles,
  Menu,
  X,
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (cityMenuRef.current && !cityMenuRef.current.contains(target)) setCityMenuOpen(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) setNotifMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setUserMenuOpen(false);
      const isClickOnMobileToggle = mobileToggleRef.current && mobileToggleRef.current.contains(target);
      const isClickInsideMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(target);
      if (!isClickOnMobileToggle && !isClickInsideMobileMenu) setMobileMenuOpen(false);
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e3e2e1]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="w-7 sm:w-8 md:w-10 h-7 sm:h-8 md:h-10 rounded-lg bg-[#003527] flex items-center justify-center text-white hover:scale-105 transition-transform">
              <span className="font-bold text-xs sm:text-sm md:text-base font-['Plus_Jakarta_Sans']">HB</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-sm md:text-lg text-[#003527] leading-tight font-['Plus_Jakarta_Sans']">
                HomeBiz
              </span>
              <span className="text-[8px] md:text-[10px] text-[#665d55] tracking-widest font-medium uppercase">
                Pakistan • Australia
              </span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-2 xl:max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-20 py-1.5 text-xs bg-[#f4f3f2] focus:bg-white border border-transparent focus:border-[#003527] rounded-full outline-none transition-all placeholder:text-[#665d55]"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#665d55]" />
              <button
                type="submit"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-[#003527] text-white text-[10px] font-bold rounded-full hover:bg-[#064e3b] transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-3 flex-shrink-0">
            <nav className="flex items-center gap-2 xl:gap-4 text-[11px] xl:text-xs font-semibold text-[#1a1c1c]">
              <Link href="/explore" className="hover:text-[#003527] transition-colors whitespace-nowrap">
                Explore
              </Link>
              <Link href="/categories" className="hover:text-[#003527] transition-colors whitespace-nowrap">
                Categories
              </Link>
              <Link href="/pricing" className="hover:text-[#003527] transition-colors whitespace-nowrap text-[#003527] font-bold">
                Pricing
              </Link>
              <Link href="/how-it-works" className="hover:text-[#003527] transition-colors whitespace-nowrap">
                How It Works
              </Link>
            </nav>

            <Link
              href="/request"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF1E7] hover:bg-[#fee5d4] text-[#735c00] border border-[#ffe088]/60 text-[10px] font-bold transition-all shadow-xs whitespace-nowrap"
            >
              <PlusCircle className="w-3 h-3" />
              Post
            </Link>

            {user && (
              <>
                <Link
                  href={role === 'SELLER' ? '/seller/dashboard/messages' : '/customer/dashboard/messages'}
                  className="relative p-1.5 text-[#1a1c1c] hover:bg-[#f4f3f2] rounded-full transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-[#ba1a1a] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={notifMenuRef}>
                  <button
                    type="button"
                    onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                    className="relative p-1.5 text-[#1a1c1c] hover:bg-[#f4f3f2] rounded-full transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full" />
                    )}
                  </button>

                  {notifMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e3e2e1] py-2 z-50">
                      <div className="px-3 py-1.5 flex items-center justify-between border-b border-[#e3e2e1]">
                        <span className="font-bold text-xs text-[#1a1c1c]">Notifications</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-[#665d55]">No notifications</div>
                        ) : (
                          notifications.slice(0, 5).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                Storage.markNotificationAsRead(notif.id);
                                setNotifMenuOpen(false);
                              }}
                              className={`p-2.5 text-[11px] hover:bg-[#f4f3f2] cursor-pointer border-b border-[#f4f3f2] ${!notif.read ? 'bg-[#b0f0d6]/10' : ''
                                }`}
                            >
                              <p className="font-bold text-[#1a1c1c]">{notif.title}</p>
                              <p className="text-[#665d55] mt-0.5">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-[#f4f3f2] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#003527]" />
                <ChevronDown className="w-2.5 h-2.5 text-[#665d55]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#e3e2e1] py-1.5 z-50">
                  {user ? (
                    <>
                      <div className="px-3 py-1.5 border-b border-[#e3e2e1]">
                        <p className="font-bold text-xs text-[#1a1c1c] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#665d55] mt-0.5 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[#003527]" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#ba1a1a] hover:bg-[#f4f3f2]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-semibold text-[#003527] hover:bg-[#f4f3f2]"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-1.5 text-xs font-semibold text-[#003527] hover:bg-[#f4f3f2]"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Right Section */}
          <div className="lg:hidden flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {!user && (
              <Link
                href="/auth/login"
                className="text-[10px] sm:text-xs font-bold text-white bg-[#003527] px-2 sm:px-2.5 py-1 rounded-full hover:bg-[#064e3b] transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            )}

            {user && (
              <Link
                href={role === 'SELLER' ? '/seller/dashboard/messages' : '/customer/dashboard/messages'}
                className="relative p-1.5 text-[#1a1c1c] hover:bg-[#f4f3f2] rounded-full transition-colors"
              >
                <MessageSquare className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-[#ba1a1a] text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              ref={mobileToggleRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-[#f4f3f2] rounded-full transition-colors lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#1a1c1c]" />
              ) : (
                <Menu className="w-5 h-5 text-[#1a1c1c]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden px-2 pb-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-14 py-1.5 text-xs bg-[#f4f3f2] focus:bg-white border border-transparent focus:border-[#003527] rounded-full outline-none transition-all placeholder:text-[#665d55]"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#665d55]" />
            <button
              type="submit"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#003527] text-white text-[9px] font-bold rounded-full hover:bg-[#064e3b] transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#e3e2e1] bg-white/95" ref={mobileMenuRef}>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 space-y-1.5">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2] transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-[#003527] hover:bg-[#b0f0d6]/20 transition-colors"
            >
              Seller Pricing
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/request"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-[#735c00] bg-[#FFF1E7] border border-[#ffe088]/60 hover:bg-[#fee5d4] transition-colors"
            >
              Post Request
            </Link>

            {/* Mobile User Section */}
            <div className="border-t border-[#e3e2e1] pt-2 space-y-1.5">
              {user ? (
                <>
                  <div className="px-3 py-1.5">
                    <p className="font-bold text-xs text-[#1a1c1c]">{user.name}</p>
                    <p className="text-[11px] text-[#665d55] mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#1a1c1c] hover:bg-[#f4f3f2]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#003527]" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#ba1a1a] hover:bg-[#f4f3f2]"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-bold text-[#003527] bg-[#f4f3f2] text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#003527] text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
