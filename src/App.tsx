import React, { useEffect } from 'react';
import { NavigationProvider, usePathname } from './lib/navigation';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { RoleSwitcherBanner } from './components/layout/RoleSwitcherBanner';

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

function AppContent() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <main className="flex-1 pb-24 md:pb-0">{renderRoute()}</main>

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
