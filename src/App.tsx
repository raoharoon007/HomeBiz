import React, { useEffect } from 'react';
import { NavigationProvider, usePathname } from './lib/navigation';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { RoleSwitcherBanner } from './components/layout/RoleSwitcherBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { SearchPage } from './pages/SearchPage';
import { VendorProfilePage } from './pages/VendorProfilePage';
import { BookingPage } from './pages/BookingPage';
import { RequestPage } from './pages/RequestPage';
import { QuotesPage } from './pages/QuotesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { BecomeSellerPage } from './pages/BecomeSellerPage';
import { BlogPage, BlogPostPage } from './pages/BlogPages';
import { ContactPage } from './pages/ContactPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { SellerDashboard } from './pages/SellerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PricingPage } from './pages/PricingPage';
import { SupabaseDb } from './lib/supabaseDb';
import { Storage } from './lib/storage';

function AppContent() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Sync live database data on app startup
  useEffect(() => {
    async function syncInitialData() {
      try {
        const [categories, cities, pricingPlans, vendors, liveBookings] = await Promise.all([
          SupabaseDb.getCategories(),
          SupabaseDb.getCities(),
          SupabaseDb.getPricingPlans(),
          SupabaseDb.getVendors(),
          SupabaseDb.getBookings(),
        ]);

        if (categories.length > 0) {
          window.localStorage.setItem('hb_categories_v1', JSON.stringify(categories));
        }
        if (cities.length > 0) {
          window.localStorage.setItem('hb_cities_v1', JSON.stringify(cities));
        }
        if (pricingPlans.length > 0) {
          window.localStorage.setItem('hb_pricing_plans_v1', JSON.stringify(pricingPlans));
        }
        if (vendors.length > 0) {
          const currentLocal = Storage.getVendors();
          const mergedMap = new Map<string, any>();
          currentLocal.forEach((v) => mergedMap.set(v.slug || v.id, v));
          vendors.forEach((v) => mergedMap.set(v.slug || v.id, v));
          window.localStorage.setItem('hb_vendors_v1', JSON.stringify(Array.from(mergedMap.values())));
        }
        if (liveBookings && liveBookings.length > 0) {
          const currentBookings = Storage.getBookings();
          const bMap = new Map<string, any>();
          currentBookings.forEach((b) => bMap.set(b.bookingNumber, b));
          liveBookings.forEach((b) => bMap.set(b.bookingNumber, b));
          window.localStorage.setItem('hb_bookings_v1', JSON.stringify(Array.from(bMap.values())));
        }
        window.dispatchEvent(new CustomEvent('hb_storage_update', { detail: { key: 'all' } }));
      } catch (e) {
        console.warn('Initial data sync error:', e);
      }
    }
    syncInitialData();
  }, []);

  // Scroll to top and update document title on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const getPageTitle = () => {
      if (pathname === '/') return "HomeBiz | Pakistan & Australia's #1 Home Business Marketplace";
      if (pathname.startsWith('/auth/register')) return 'Register | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/auth/login')) return 'Sign In | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/admin/dashboard')) return 'Admin Verification Panel | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/seller/dashboard')) return 'Seller Storefront Hub | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/customer/dashboard')) return 'Customer Account | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/explore')) return 'Explore Home Businesses | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/categories')) return 'Browse Categories | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/become-a-seller')) return 'Become a Verified Seller | HomeBiz Pakistan & Australia';
      if (pathname.startsWith('/pricing')) return 'Seller Plans & Pricing | HomeBiz Pakistan & Australia';
      return 'HomeBiz | Pakistan & Australia';
    };

    document.title = getPageTitle();
  }, [pathname]);

  useEffect(() => {
    const protectedPaths = ['/customer/dashboard', '/seller/dashboard', '/admin/dashboard'];
    const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtectedRoute && !user) {
      if (window.location.pathname !== '/auth/login') {
        window.history.replaceState({}, '', '/auth/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [pathname, user]);

  // Route resolver
  const renderRoute = () => {
    const protectedPaths = ['/customer/dashboard', '/seller/dashboard', '/admin/dashboard'];
    const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtectedRoute && !user) {
      return <LoginPage />;
    }

    if (pathname === '/' || pathname === '') {
      return <HomePage />;
    }
    if (pathname === '/explore') {
      return <ExplorePage />;
    }
    if (pathname === '/categories') {
      return <CategoriesPage />;
    }
    if (pathname.startsWith('/categories/')) {
      return <CategoryDetailPage />;
    }
    if (pathname.startsWith('/search')) {
      return <SearchPage />;
    }
    if (pathname.startsWith('/vendors/')) {
      return <VendorProfilePage />;
    }
    if (pathname.startsWith('/booking/')) {
      return <BookingPage />;
    }
    if (pathname === '/request') {
      return <RequestPage />;
    }
    if (pathname.startsWith('/quotes/')) {
      return <QuotesPage />;
    }
    if (pathname === '/how-it-works') {
      return <HowItWorksPage />;
    }
    if (pathname === '/become-a-seller') {
      return <BecomeSellerPage />;
    }
    if (pathname === '/pricing') {
      return <PricingPage />;
    }
    if (pathname === '/blog') {
      return <BlogPage />;
    }
    if (pathname.startsWith('/blog/')) {
      return <BlogPostPage />;
    }
    if (pathname === '/contact') {
      return <ContactPage />;
    }
    if (pathname === '/auth/login') {
      return <LoginPage />;
    }
    if (pathname === '/auth') {
      return <LoginPage />;
    }
    if (pathname === '/auth/register') {
      return <RegisterPage />;
    }
    if (pathname === '/auth/forgot-password') {
      return <ForgotPasswordPage />;
    }
    if (pathname.startsWith('/customer/dashboard')) {
      return <CustomerDashboard />;
    }
    if (pathname.startsWith('/seller/dashboard')) {
      return <SellerDashboard />;
    }
    if (pathname.startsWith('/admin/dashboard')) {
      return <AdminDashboard />;
    }

    // Default fallback to HomePage
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f8] text-[#1a1c1c] font-['Inter'] antialiased selection:bg-[#003527] selection:text-white">
      {/* Top Demo Persona Switcher Banner */}
      <RoleSwitcherBanner />

      {/* Main Sticky Header Navbar */}
      <Navbar />

      {/* Main Page View Area */}
      <main className="flex-1 pb-24 md:pb-0">
        <ErrorBoundary>
          {renderRoute()}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
