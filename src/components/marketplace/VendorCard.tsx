import React from 'react';
import { Link, useRouter } from '../../lib/navigation';
import { VendorProfile } from '../../types';
import { useAuth } from '../../lib/authContext';
import { Storage, useStorageSubscription } from '../../lib/storage';
import { Star, MapPin, CheckCircle, Heart, Sparkles, Clock } from 'lucide-react';
import { formatPrice } from '../../lib/countryUtils';

interface VendorCardProps {
  key?: React.Key;
  vendor: VendorProfile;
  compact?: boolean;
}

export function VendorCard({ vendor, compact = false }: VendorCardProps) {
  const router = useRouter();
  useStorageSubscription();
  const { user } = useAuth();
  const isFav = user ? Storage.isFavorite(user.id, vendor.id) : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    Storage.toggleFavorite(user.id, vendor.id);
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#e3e2e1] hover:border-[#003527]/40 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Card Image Area */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        <Link href={`/vendors/${vendor.slug}`} className="block w-full h-full">
          <img
            src={vendor.coverImage}
            alt={vendor.businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {vendor.isFeatured && (
            <span className="inline-flex items-center gap-1 bg-[#003527] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
              <Sparkles className="w-3 h-3 text-[#ffe088]" />
              Featured
            </span>
          )}
          {vendor.verificationStatus === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1 bg-white/95 text-[#003527] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs">
              <CheckCircle className="w-3 h-3 text-[#003527] fill-[#b0f0d6]" />
              Verified
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 flex items-center justify-center shadow-md backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 z-10"
          title={isFav ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'text-red-500 fill-red-500' : 'text-stone-600'
            }`}
          />
        </button>

        {/* Vendor Avatar overlapping */}
        <div className="absolute -bottom-4 right-4 z-10">
          <img
            src={vendor.avatar}
            alt={vendor.businessName}
            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Rating */}
          <div className="flex items-center justify-between text-xs text-[#665d55] mb-1.5">
            <span className="flex items-center gap-1 truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 text-[#003527] flex-shrink-0" />
              <span className="truncate">{vendor.locality || vendor.city}</span>
            </span>

            <div className="flex items-center gap-1 bg-[#FFF1E7] text-[#735c00] px-2 py-0.5 rounded-md font-bold text-[11px] flex-shrink-0">
              <Star className="w-3 h-3 text-[#cca72f] fill-[#cca72f]" />
              <span>{vendor.rating.toFixed(1)}</span>
              <span className="text-[#665d55] font-normal">({vendor.reviewCount})</span>
            </div>
          </div>

          {/* Business Title */}
          <Link href={`/vendors/${vendor.slug}`} className="block">
            <h3 className="font-bold text-sm sm:text-base text-[#1a1c1c] group-hover:text-[#003527] transition-colors line-clamp-1">
              {vendor.businessName}
            </h3>
          </Link>

          {/* Tagline */}
          <p className="text-xs text-[#404944] line-clamp-2 mt-1 leading-relaxed">
            {vendor.tagline}
          </p>

          {/* Specialties / Subcategories Chips */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {vendor.specialties.slice(0, 2).map((spec, i) => (
              <span
                key={i}
                className="text-[10px] bg-[#f4f3f2] text-[#404944] px-2 py-0.5 rounded-full font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Strip: Price & CTA */}
        <div className="pt-3.5 mt-3.5 border-t border-[#f4f3f2] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#665d55] block uppercase tracking-wider font-semibold">
              Starting from
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#003527]">
              {formatPrice(vendor.startingPrice, vendor.city)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/vendors/${vendor.slug}`}
              className="px-3 py-1.5 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              View Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
