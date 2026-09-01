import React, { useState } from 'react';
import { Link, useRouter } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { VendorCard } from '../components/marketplace/VendorCard';
import { CategoryCard } from '../components/marketplace/CategoryCard';

import {
  Search,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Star,
  Users,
  ChevronRight,
  Store,
  Award,
} from 'lucide-react';

export function HomePage() {
  useStorageSubscription();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Lahore');

  const categories = Storage.getCategories();
  const vendors = Storage.getVendors();
  const cities = Storage.getCities();

  const featuredVendors = vendors.filter((v) => v.isFeatured || v.rating >= 4.9);
  const lahoreVendors = vendors.filter((v) => v.city === 'Lahore');

  const popularChips = [
    { label: '🎂 Vintage Cakes', query: 'cakes' },
    { label: '🌿 Organic Mehndi', query: 'mehndi' },
    { label: '💄 Bridal Glam', query: 'makeup' },
    { label: '🍲 Hyderabadi Biryani', query: 'biryani' },
    { label: '✂️ Lawn Stitching', query: 'tailoring' },
    { label: '📸 Dholki Photography', query: 'photography' },
  ];

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-[#003527] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-[2.5rem] shadow-xl">
        {/* Background Subtle Gradient Accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#064e3b] blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#b0f0d6]/10 blur-3xl opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Headline, Search, Badges */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#b0f0d6]/15 border border-[#95d3ba]/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#b0f0d6]">
              <Sparkles className="w-3.5 h-3.5 text-[#ffe088]" />
              <span>SUPPORT LOCAL • SHOP LOCAL PAKISTAN & AUSTRALIA</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-['Plus_Jakarta_Sans'] tracking-tight leading-[1.1]">
              Discover Amazing{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffe088] via-[#b0f0d6] to-white">
                Home Businesses
              </span>{' '}
              Near You
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl leading-relaxed">
              Order artisanal celebration cakes, authentic ghar ka khana, bridal organic mehndi, bespoke tailoring, and home tutoring from trusted micro-entrepreneurs in Pakistan and Australia.
            </p>

            {/* Main Search Bar Form */}
            <form
              onSubmit={handleHeroSearch}
              className="bg-white p-2 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/40"
            >
              {/* City selector inside search */}
              <div className="flex items-center gap-2 px-3 py-2 sm:py-1 border-b sm:border-b-0 sm:border-r border-stone-200 w-full sm:w-auto">
                <MapPin className="w-4 h-4 text-[#003527] flex-shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="text-xs font-bold text-[#1a1c1c] bg-transparent outline-none cursor-pointer"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.name} className="text-stone-900">
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text search input */}
              <div className="flex-1 flex items-center gap-2 px-3 py-1 w-full">
                <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What service are you looking for? (e.g. vintage cake)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 bg-transparent outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-full shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Find Sellers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Popular Search Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-emerald-200 font-semibold">Popular:</span>
              {popularChips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(chip.query)}&city=${encodeURIComponent(selectedCity)}`)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-1 rounded-full border border-emerald-700/50 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Trust & Guarantee Metrics */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-emerald-800/60 max-w-lg">
              <div>
                <span className="text-lg sm:text-2xl font-black text-[#ffe088] block">500+</span>
                <span className="text-[11px] text-emerald-200">Verified Creators</span>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-black text-[#ffe088] block">4.9★</span>
                <span className="text-[11px] text-emerald-200">Customer Rating</span>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-black text-[#ffe088] block">100%</span>
                <span className="text-[11px] text-emerald-200">Safe Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Photo Collage & Floating Trust Badge */}
          <div className="lg:col-span-5 relative hidden sm:block">
            <div className="relative mx-auto max-w-md">
              {/* Main Featured Photo */}
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"
                  alt="Custom Cake"
                  className="w-full h-80 object-cover"
                />
              </div>

              {/* Floating Second Photo */}
              <div className="absolute -bottom-8 -left-8 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 transform rotate-3 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80"
                  alt="Bridal Mehndi"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Social Proof Card */}
              <div className="absolute -top-4 -right-4 bg-white text-[#1a1c1c] p-3.5 rounded-2xl shadow-xl border border-stone-200 max-w-[200px] animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs text-[#cca72f] font-bold">
                  <Star className="w-4 h-4 fill-[#cca72f]" />
                  <span>10,000+ Orders</span>
                </div>
                <p className="text-[11px] text-[#404944] mt-0.5 font-medium leading-tight">
                  Fulfilled by home businesses in Lahore & Karachi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
              Browse by Industry
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Explore Popular Categories
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-[#003527] hover:underline flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} variant="card" />
          ))}
        </div>
      </section>

      {/* CUSTOM REQUEST CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#FFF1E7] via-[#faf9f8] to-[#eee0d6] rounded-3xl p-6 sm:p-10 border border-[#ffe088]/80 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#cca72f]/20 text-[#735c00] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Have a Custom Request?</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Can't Find Exactly What You Need?
            </h3>
            <p className="text-xs sm:text-sm text-[#404944] leading-relaxed">
              Post your custom requirements (event date, guest count, reference pictures, and PKR budget). Verified home creators will send you itemized quotes to compare!
            </p>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            <Link
              href="/request"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs sm:text-sm shadow-lg transition-transform hover:scale-105"
            >
              <PlusCircle className="w-4 h-4 text-[#ffe088]" />
              <span>Post a Free Request</span>
            </Link>
          </div>
        </div>
      </section>

      {/* TOP RATED IN LAHORE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-[#003527] uppercase tracking-wider">
              Loved by Your City
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Top Rated Home Businesses in Lahore
            </h2>
          </div>
          <Link
            href="/search?city=Lahore"
            className="text-xs font-bold text-[#003527] hover:underline flex items-center gap-1"
          >
            <span>See all in Lahore</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lahoreVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16 border-y border-[#e3e2e1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              How HomeBiz Works for Customers
            </h2>
            <p className="text-xs sm:text-sm text-[#665d55]">
              Connecting you directly with vetted local home businesses in 3 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#faf9f8] p-6 rounded-2xl border border-[#e3e2e1] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#003527] text-white flex items-center justify-center mx-auto text-lg font-bold">
                1
              </div>
              <h3 className="font-bold text-base text-[#1a1c1c]">Discover & Chat</h3>
              <p className="text-xs text-[#404944] leading-relaxed">
                Browse verified menus, customer reviews, photo galleries, and message creators in real time to discuss custom preferences.
              </p>
            </div>

            <div className="bg-[#faf9f8] p-6 rounded-2xl border border-[#e3e2e1] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#003527] text-white flex items-center justify-center mx-auto text-lg font-bold">
                2
              </div>
              <h3 className="font-bold text-base text-[#1a1c1c]">Book or Request Quotes</h3>
              <p className="text-xs text-[#404944] leading-relaxed">
                Directly book instant service slots or post a custom request with your budget to receive competitive itemized quotes.
              </p>
            </div>

            <div className="bg-[#faf9f8] p-6 rounded-2xl border border-[#e3e2e1] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#003527] text-white flex items-center justify-center mx-auto text-lg font-bold">
                3
              </div>
              <h3 className="font-bold text-base text-[#1a1c1c]">Safe Guarantee & Delivery</h3>
              <p className="text-xs text-[#404944] leading-relaxed">
                Receive your fresh cake, bridal mehndi, or custom stitched suit at your doorstep. Cash on delivery & digital payment options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BECOME A SELLER PROMO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#003527] text-white rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="text-xs font-bold text-[#ffe088] uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              <span>For Pakistani Home Creators</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-['Plus_Jakarta_Sans'] tracking-tight">
              Turn Your Home Kitchen, Sewing Studio, or Art into a Thriving Business
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Join hundreds of female entrepreneurs and home creators in Lahore, Karachi, and Islamabad who manage orders, booking calendars, customer quotes, and direct messaging on HomeBiz.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/become-a-seller"
                className="px-6 py-3 rounded-full bg-[#ffe088] hover:bg-[#ffe7a3] text-[#003527] font-extrabold text-xs sm:text-sm shadow-md transition-transform hover:scale-105"
              >
                Register as a Home Seller
              </Link>
              <Link
                href="/how-it-works"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/30 transition-colors"
              >
                Learn Seller Benefits
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#b0f0d6]" />
                <span>Keep 95% of your earnings</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#b0f0d6]" />
                <span>Automated calendar & slot limits</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#b0f0d6]" />
                <span>Direct customer chat in Urdu & English</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#b0f0d6]" />
                <span>Free verified seller badge</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
