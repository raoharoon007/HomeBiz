import React from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { VendorCard } from '../components/marketplace/VendorCard';
import { Sparkles, ArrowLeft, PlusCircle, Store } from 'lucide-react';

export function CategoryDetailPage() {
  useStorageSubscription();
  const pathname = usePathname();
  const slug = pathname.replace('/categories/', '').split('/')[0];

  const category =
    Storage.getCategories().find((c) => c.slug === slug) || Storage.getCategories()[0];

  const vendors = Storage.getVendors().filter((v) => v.category === category.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003527] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </Link>
      </div>

      {/* Category Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#003527] text-white p-8 sm:p-12 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#b0f0d6]/20 px-3 py-1 rounded-full text-xs font-semibold text-[#b0f0d6]">
            <Sparkles className="w-3.5 h-3.5 text-[#ffe088]" />
            <span>{vendors.length} Verified Creators in Pakistan & Australia</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-['Plus_Jakarta_Sans']">
            {category.name}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {category.description}
          </p>

          {/* Subcategories tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {category.subcategories.map((sub, i) => (
              <span
                key={i}
                className="text-xs bg-white/10 text-emerald-100 px-3 py-1 rounded-full border border-white/20"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Available {category.name} Creators
          </h2>
          <Link
            href={`/request?category=${category.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#003527] bg-[#FFF1E7] px-3 py-1.5 rounded-full border border-[#ffe088]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#cca72f]" />
            <span>Post a Custom Request in {category.name}</span>
          </Link>
        </div>

        {vendors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-xl shadow-inner">
              🏪
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#1a1c1c] text-base">No businesses listed yet in {category.name}</h3>
              <p className="text-xs text-[#665d55]">
                Be the first verified creator in {category.name} to list your business and receive customer inquiries!
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Link
                href="/become-a-seller"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <Store className="w-4 h-4 text-[#ffe088]" />
                <span>List Your Business</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
