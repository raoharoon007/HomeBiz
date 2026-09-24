import React from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { QuoteComparison } from '../components/marketplace/QuoteComparison';
import { Sparkles, MapPin, Calendar, ArrowLeft, Clock, ShieldAlert } from 'lucide-react';

export function QuotesPage() {
  useStorageSubscription();
  const pathname = usePathname();
  const { user } = useAuth();

  // Extract requestId from /quotes/:requestId
  const requestId = pathname.replace('/quotes/', '').split('/')[0];
  const request = Storage.getRequestById(requestId);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#FFF1E7] text-[#735c00] mx-auto flex items-center justify-center font-bold text-lg">
          🔒
        </div>
        <h2 className="text-xl font-bold text-[#1a1c1c]">Sign In Required</h2>
        <p className="text-xs text-[#665d55] leading-relaxed">
          Quotes on HomeBiz are private. Please sign in to view quotes submitted for your request.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/auth/login" className="px-6 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#1a1c1c]">Request Not Found</h2>
        <p className="text-xs text-[#665d55]">The requested quote broadcast could not be located.</p>
        <Link href="/customer/dashboard/requests" className="inline-block px-5 py-2 rounded-full bg-[#003527] text-white text-xs font-bold">
          Back to My Requests
        </Link>
      </div>
    );
  }

  const allQuotes = Storage.getQuotesForRequest(request.id);
  const isOwner = user.id === request.customerId;
  const isAdmin = user.role === 'ADMIN';
  const isQuotingSeller = Boolean(
    user.role === 'SELLER' &&
    user.sellerProfileId &&
    allQuotes.some((q) => q.vendorId === user.sellerProfileId)
  );

  // Authorization check: only owner, admin, or quoting seller can access
  if (!isOwner && !isAdmin && !isQuotingSeller) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 text-[#ba1a1a] mx-auto flex items-center justify-center font-bold text-lg">
          <ShieldAlert className="w-6 h-6 text-[#ba1a1a]" />
        </div>
        <h2 className="text-xl font-bold text-[#1a1c1c]">Access Restricted</h2>
        <p className="text-xs text-[#665d55]">
          You are not authorized to view quotes for this customer request. Quotation details are private between the customer and participating vendors.
        </p>
        <Link href="/" className="inline-block px-5 py-2 rounded-full bg-[#003527] text-white text-xs font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  // Competitor privacy: vendors can ONLY see their own quote, while customers & admins see all quotes
  const visibleQuotes = isQuotingSeller && !isAdmin && !isOwner
    ? allQuotes.filter((q) => q.vendorId === user.sellerProfileId)
    : allQuotes;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={isOwner ? '/customer/dashboard/requests' : '/seller/dashboard/requests'}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#003527] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isOwner ? 'Back to My Requests' : 'Back to Requests Hub'}</span>
        </Link>
      </div>

      {/* Request Header Summary */}
      <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f4f3f2]">
          <div>
            <span className="text-[10px] font-bold text-[#665d55] tracking-widest uppercase">
              Request #{request.requestNumber}
            </span>
            <h1 className="text-lg sm:text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              {request.serviceNeeded}
            </h1>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold ${
              request.status === 'ACCEPTED'
                ? 'bg-[#b0f0d6]/40 text-[#003527]'
                : 'bg-[#FFF1E7] text-[#735c00]'
            }`}
          >
            Status: {request.status}
          </span>
        </div>

        <p className="text-xs text-[#404944] leading-relaxed">{request.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#665d55] pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#003527]" />
            <span>{request.area}, {request.city}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#003527]" />
            <span>Needed by: {request.preferredDate}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#003527]" />
            <span>Target: Rs. {request.budget.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Itemized Quotes Comparison */}
      <QuoteComparison request={request} quotes={visibleQuotes} />
    </div>
  );
}
