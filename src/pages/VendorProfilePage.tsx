import React, { useState } from 'react';
import { usePathname, useRouter, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { VendorCard } from '../components/marketplace/VendorCard';
import { AddReviewModal } from '../components/marketplace/AddReviewModal';
import {
  Star,
  MapPin,
  CheckCircle,
  Heart,
  Share2,
  MessageSquare,
  Sparkles,
  Clock,
  ShieldCheck,
  Calendar,
  PlusCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

export function VendorProfilePage() {
  useStorageSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuth();

  // Extract slug from /vendors/:slug
  const slug = pathname.replace('/vendors/', '').split('/')[0];
  const vendor = Storage.getVendorBySlug(slug) || Storage.getVendors()[0];

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const reviews = Storage.getReviews(vendor.id);
  const isFav = user ? Storage.isFavorite(user.id, vendor.id) : false;
  const relatedVendors = Storage.getVendors()
    .filter((v) => v.id !== vendor.id && (v.category === vendor.category || v.city === vendor.city))
    .slice(0, 3);

  const handleStartChat = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    Storage.getOrCreateConversation(user.id, vendor.id, {
      type: 'GENERAL',
      id: vendor.id,
      title: `Inquiry: ${vendor.businessName}`,
    });
    router.push(role === 'SELLER' ? '/seller/dashboard/messages' : '/customer/dashboard/messages');
  };

  const handleBookService = (serviceId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const targetService = serviceId || vendor.services?.[0]?.id || 'custom-order';
    router.push(`/booking/${vendor.id}?serviceId=${targetService}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vendor.businessName} on HomeBiz`,
        text: vendor.tagline,
        url: window.location.href,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* PHOTO GALLERY HEADER: 1 Big + 2 Small */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-80 sm:h-96 rounded-3xl overflow-hidden shadow-md border border-[#e3e2e1]">
        {/* Left Large Photo */}
        <div className="md:col-span-2 relative h-full bg-stone-100 group overflow-hidden">
          <img
            src={vendor.coverImage}
            alt={vendor.businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {vendor.isFeatured && (
              <span className="bg-[#003527] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ffe088]" />
                Featured Creator
              </span>
            )}
            {vendor.verificationStatus === 'VERIFIED' && (
              <span className="bg-white/95 text-[#003527] text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#003527] fill-[#b0f0d6]" />
                Verified Business
              </span>
            )}
          </div>
        </div>

        {/* Right Stacked 2 Small Photos */}
        <div className="hidden md:grid grid-rows-2 gap-3 h-full">
          <div className="relative h-full bg-stone-100 overflow-hidden group">
            <img
              src={vendor.gallery[1] || vendor.coverImage}
              alt="Gallery 1"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="relative h-full bg-stone-100 overflow-hidden group">
            <img
              src={vendor.gallery[2] || vendor.coverImage}
              alt="Gallery 2"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs backdrop-blur-2xs cursor-pointer hover:bg-black/50 transition-colors">
              +{vendor.gallery.length} Photos
            </div>
          </div>
        </div>
      </div>

      {/* VENDOR PROFILE HEADER INFO & ACTIONS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-6">
          <img
            src={vendor.avatar}
            alt={vendor.businessName}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#95d3ba] shadow-md flex-shrink-0"
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                {vendor.businessName}
              </h1>
              {vendor.verificationStatus === 'VERIFIED' && (
                <span className="text-xs bg-[#b0f0d6]/40 text-[#003527] px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#404944] max-w-xl font-medium">{vendor.tagline}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#665d55] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#003527]" />
                <span>{vendor.locality}, {vendor.city}</span>
              </span>

              <span className="flex items-center gap-1 text-[#cca72f] font-bold">
                <Star className="w-3.5 h-3.5 fill-[#cca72f]" />
                <span>{vendor.rating.toFixed(2)}</span>
                <span className="text-[#665d55] font-normal">({vendor.reviewCount} customer reviews)</span>
              </span>

              <span className="flex items-center gap-1 text-[#003527] font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Replies {vendor.responseTime}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              if (!user) {
                router.push('/auth/login');
                return;
              }
              Storage.toggleFavorite(user.id, vendor.id);
            }}
            className={`p-3 rounded-full border border-[#e3e2e1] transition-colors ${isFav ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-stone-700 hover:bg-[#f4f3f2]'
              }`}
            title="Save to favorites"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-3 rounded-full bg-white border border-[#e3e2e1] text-stone-700 hover:bg-[#f4f3f2] transition-colors"
            title="Share profile"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleStartChat}
            className="px-4 py-3 rounded-full bg-white border border-[#003527] text-[#003527] font-bold text-xs hover:bg-[#003527]/5 flex items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat Creator</span>
          </button>

          <Link
            href={`/request?vendorId=${vendor.id}&category=${vendor.category}`}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                router.push('/auth/login');
              }
            }}
            className="px-5 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105"
          >
            <PlusCircle className="w-4 h-4 text-[#ffe088]" />
            <span>Request Custom Quote</span>
          </Link>
        </div>
      </div>

      {/* TWO COLUMN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: About, Services Menu, Reviews */}
        <div className="lg:col-span-8 space-y-8">
          {/* About Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-4">
            <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              About the Creator
            </h2>
            <p className="text-xs sm:text-sm text-[#404944] leading-relaxed whitespace-pre-line">
              {vendor.description}
            </p>

            {/* Specialties Badges */}
            <div className="pt-2">
              <span className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-2">
                Specialties & Highlights
              </span>
              <div className="flex flex-wrap gap-2">
                {vendor.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[#FFF1E7] text-[#735c00] border border-[#ffe088]/60 px-3 py-1 rounded-full font-semibold"
                  >
                    ✨ {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Services & Packages Menu */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Services & Menu Packages ({vendor.services.length})
              </h2>
              <span className="text-xs text-[#665d55]">Instant online booking available</span>
            </div>

            <div className="space-y-4">
              {vendor.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-5 border border-[#e3e2e1] hover:border-[#003527]/40 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-20 h-20 rounded-xl object-cover border border-[#e3e2e1] flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-[#1a1c1c]">
                          {service.title}
                        </h3>
                        {service.isPopular && (
                          <span className="text-[10px] bg-[#003527] text-white px-2 py-0.5 rounded-full font-bold">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#404944] leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#665d55] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#003527]" />
                          {service.noticePeriod}
                        </span>
                        {service.duration && <span>• {service.duration}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f4f3f2]">
                    <div className="text-left sm:text-right">
                      <span className="text-base sm:text-lg font-black text-[#003527] block">
                        Rs. {service.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookService(service.id)}
                      className="px-4 py-2 bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs rounded-full shadow-xs transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#f4f3f2]">
              <div>
                <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                  Verified Reviews ({reviews.length})
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[#cca72f] font-black text-sm">
                    <Star className="w-4 h-4 fill-[#cca72f]" />
                    <span>{vendor.rating.toFixed(2)} out of 5.0</span>
                  </div>
                  <span className="text-xs text-[#665d55]">• 100% verified orders</span>
                </div>
              </div>

              <button
                onClick={() => setReviewModalOpen(true)}
                className="px-4 py-2 rounded-full border border-[#003527] text-[#003527] hover:bg-[#003527]/5 text-xs font-bold"
              >
                Write a Review
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#665d55]">No reviews yet. Be the first to order and review!</div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="space-y-3 pb-4 border-b border-[#f4f3f2] last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            rev.customerAvatar ||
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={rev.customerName}
                          className="w-9 h-9 rounded-full object-cover border border-[#e3e2e1]"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-[#1a1c1c]">{rev.customerName}</h4>
                          <span className="text-[10px] text-[#665d55]">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-[#cca72f]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#cca72f]" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#404944] leading-relaxed">{rev.comment}</p>

                    {/* Seller Response Reply */}
                    {rev.sellerReply && (
                      <div className="ml-6 p-3 bg-[#faf9f8] rounded-2xl border-l-4 border-[#003527] text-xs space-y-1">
                        <span className="font-bold text-[#003527] text-[11px] block">
                          Response from {vendor.businessName}
                        </span>
                        <p className="text-[#404944] text-[11px] leading-relaxed italic">
                          "{rev.sellerReply.text}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Availability Calendar & Service Area Widget */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          {/* Availability Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#003527] font-bold text-sm">
              <Calendar className="w-4 h-4" />
              <span>Ordering & Availability</span>
            </div>

            <div className="p-3 bg-[#b0f0d6]/20 border border-[#95d3ba]/40 rounded-2xl text-xs text-[#003527]">
              <span className="font-bold block mb-0.5">🟢 Taking Orders Now</span>
              <p className="text-[11px]">{vendor.availabilityNotice}</p>
            </div>

            <div className="space-y-2 text-xs text-[#404944]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#f4f3f2]">
                <span className="text-[#665d55]">Experience</span>
                <span className="font-bold text-[#1a1c1c]">{vendor.experienceYears} Years</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#f4f3f2]">
                <span className="text-[#665d55]">City Base</span>
                <span className="font-bold text-[#1a1c1c]">{vendor.city}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#f4f3f2]">
                <span className="text-[#665d55]">Average Response</span>
                <span className="font-bold text-[#003527]">{vendor.responseTime}</span>
              </div>
            </div>

            <button
              onClick={() => handleBookService(vendor.services?.[0]?.id || 'custom-order')}
              className="w-full py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Instant Book a Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Service Area Delivery Coverage */}
          <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#1a1c1c] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#003527]" />
              <span>Delivery & Service Areas</span>
            </h3>
            <p className="text-xs text-[#665d55]">
              Available for delivery and visits in the following localities of {vendor.city}:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {vendor.serviceAreas.map((area, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-[#f4f3f2] text-[#404944] px-2.5 py-1 rounded-full font-medium"
                >
                  📍 {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RELATED CREATORS */}
      {relatedVendors.length > 0 && (
        <div className="pt-8 border-t border-[#e3e2e1] space-y-4">
          <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Similar Creators in {vendor.city}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedVendors.map((rel) => (
              <VendorCard key={rel.id} vendor={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      <AddReviewModal
        vendorId={vendor.id}
        vendorName={vendor.businessName}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
    </div>
  );
}
