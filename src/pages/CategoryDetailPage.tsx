import React from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { VendorCard } from '../components/marketplace/VendorCard';
import { Sparkles, ArrowLeft, PlusCircle } from 'lucide-react';

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
            <span>{vendors.length} Verified Creators in Pakistan</span>
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
          <div className="bg-white rounded-2xl border border-[#e3e2e1] p-12 text-center text-xs text-[#665d55]">
            No sellers registered in this category yet. Be the first to join!
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
