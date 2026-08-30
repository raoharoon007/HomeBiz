import React from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { QuoteComparison } from '../components/marketplace/QuoteComparison';
import { Sparkles, MapPin, Calendar, ArrowLeft, Clock } from 'lucide-react';

export function QuotesPage() {
  useStorageSubscription();
  const pathname = usePathname();

  // Extract requestId from /quotes/:requestId
  const requestId = pathname.replace('/quotes/', '').split('/')[0];
  const request = Storage.getRequestById(requestId) || Storage.getRequests()[0];

  const quotes = Storage.getQuotesForRequest(request.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/customer/dashboard/requests"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#003527] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Requests</span>
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
      <QuoteComparison request={request} quotes={quotes} />
    </div>
  );
}
