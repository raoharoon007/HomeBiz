import React from 'react';
import { Storage, useStorageSubscription } from '../lib/storage';
import { VendorCard } from '../components/marketplace/VendorCard';
import { CategoryCard } from '../components/marketplace/CategoryCard';
import { Link } from '../lib/navigation';
import { Sparkles, MapPin, Award, ChevronRight } from 'lucide-react';

export function ExplorePage() {
  useStorageSubscription();
  const vendors = Storage.getVendors();
  const categories = Storage.getCategories();
  const cities = Storage.getCities();

  const featured = vendors.filter((v) => v.isFeatured);
  const topRated = [...vendors].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Explore Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
          Curated Showcase
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
          Explore Handpicked Home Creators
        </h1>
        <p className="text-xs sm:text-sm text-[#665d55]">
          Discover top-rated artisanal talents, verified micro-businesses, and customer favorites across Pakistan and Australia.
        </p>
      </div>

      {/* Categories Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Browse Popular Industries
          </h2>
          <Link href="/categories" className="text-xs font-bold text-[#003527] hover:underline">
            View All
          </Link>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} variant="pill" />
          ))}
        </div>
      </div>

      {/* Featured Creators Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#cca72f]" />
              <span>Featured Home Businesses</span>
            </h2>
            <p className="text-xs text-[#665d55]">Handpicked for excellence, hygiene, and outstanding ratings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </div>

      {/* City Hubs Bar */}
      <div className="bg-[#FFF1E7] rounded-3xl p-6 sm:p-8 border border-[#ffe088] space-y-4">
        <h2 className="text-lg font-black text-[#735c00] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#cca72f]" />
          <span>Explore by City</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/search?city=${encodeURIComponent(city.name)}`}
              className="bg-white p-3.5 rounded-2xl border border-stone-200 hover:border-[#003527] text-center shadow-2xs hover:shadow-md transition-all group"
            >
              <span className="font-bold text-xs text-[#1a1c1c] group-hover:text-[#003527] block">
                {city.name}
              </span>
              <span className="text-[10px] text-[#665d55] block mt-0.5">
                {city.vendorCount} sellers
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Rated Hall of Fame */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#003527]" />
          <span>Highest Customer Ratings</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topRated.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </div>
    </div>
  );
}
