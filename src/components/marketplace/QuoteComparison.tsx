import React, { useState } from 'react';
import { Quote, CustomerRequest } from '../../types';
import { Storage } from '../../lib/storage';
import { useRouter, Link } from '../../lib/navigation';
import { Star, CheckCircle, Clock, ShieldCheck, ArrowRight, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuoteComparisonProps {
  request: CustomerRequest;
  quotes: Quote[];
  onQuoteAccepted?: () => void;
}

export function QuoteComparison({ request, quotes, onQuoteAccepted }: QuoteComparisonProps) {
  const router = useRouter();
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);

  const handleAccept = (quoteId: string) => {
    setAcceptingQuoteId(quoteId);
    try {
      const newBooking = Storage.acceptQuote(quoteId);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        onQuoteAccepted?.();
        if (newBooking) {
          router.push('/customer/dashboard/bookings');
        }
      }, 800);
    } catch (e) {
      console.error(e);
      setAcceptingQuoteId(null);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e3e2e1] p-8 text-center">
        <Clock className="w-10 h-10 text-[#cca72f] mx-auto mb-3" />
        <h4 className="font-bold text-base text-[#1a1c1c]">Waiting for Seller Quotes</h4>
        <p className="text-xs text-[#665d55] max-w-md mx-auto mt-1">
          Your request has been broadcasted to verified home creators in {request.city}. You will receive custom itemized quotes shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-[#1a1c1c]">Compare Vendor Quotes ({quotes.length})</h3>
          <p className="text-xs text-[#665d55]">Review itemized pricing and seller notes before accepting.</p>
        </div>
        <span className="text-xs font-bold text-[#003527] bg-[#b0f0d6]/30 px-3 py-1 rounded-full border border-[#95d3ba]/40">
          Target Budget: Rs. {request.budget.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote) => {
          const isAccepted = quote.status === 'ACCEPTED';

          return (
            <div
              key={quote.id}
              className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isAccepted
                  ? 'border-[#003527] ring-2 ring-[#b0f0d6] shadow-md'
                  : 'border-[#e3e2e1] hover:border-[#003527]/40 shadow-xs'
              }`}
            >
              <div>
                {/* Vendor Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f4f3f2]">
                  <div className="flex items-center gap-3">
                    <img
                      src={quote.vendorAvatar}
                      alt={quote.vendorName}
                      className="w-12 h-12 rounded-xl object-cover border border-[#e3e2e1]"
                    />
                    <div>
                      <Link
                        href={`/vendors/${quote.vendorSlug}`}
                        className="font-bold text-sm text-[#1a1c1c] hover:text-[#003527] transition-colors"
                      >
                        {quote.vendorName}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-[#665d55] mt-0.5">
                        <div className="flex items-center gap-0.5 text-[#cca72f] font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-[#cca72f]" />
                          <span>{quote.vendorRating.toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <span className="text-[11px]">{quote.vendorReviewCount} reviews</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#665d55] block uppercase tracking-wider font-semibold">
                      Total Quote
                    </span>
                    <span className="text-lg font-black text-[#003527]">
                      Rs. {quote.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Seller Message */}
                <div className="my-3 p-3 bg-[#faf9f8] rounded-xl border border-[#f4f3f2]">
                  <p className="text-xs text-[#404944] italic leading-relaxed">
                    "{quote.message}"
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[#665d55]">
                    <Clock className="w-3 h-3 text-[#003527]" />
                    <span>{quote.estimatedCompletion}</span>
                  </div>
                </div>

                {/* Itemized Breakdown */}
                <div className="space-y-1.5 py-2">
                  <span className="text-[10px] text-[#665d55] uppercase font-bold tracking-wider block mb-1">
                    Itemized Cost Breakdown
                  </span>
                  {quote.itemsBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-[#1a1c1c]">
                      <span className="text-[#404944] truncate max-w-[70%]">{item.name}</span>
                      <span className="font-semibold text-stone-800">Rs. {item.cost.toLocaleString()}</span>
                    </div>
                  ))}
                  {quote.deliveryFee > 0 && (
                    <div className="flex items-center justify-between text-xs text-[#1a1c1c]">
                      <span className="text-[#404944]">Chilled / Doorstep Delivery</span>
                      <span className="font-semibold text-stone-800">Rs. {quote.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#f4f3f2] flex items-center gap-2">
                <Link
                  href={`/customer/dashboard/messages`}
                  className="px-3 py-2 rounded-xl border border-[#e3e2e1] hover:bg-[#f4f3f2] text-xs font-semibold text-[#404944] flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </Link>

                {isAccepted ? (
                  <div className="flex-1 py-2 px-3 bg-[#b0f0d6]/30 text-[#003527] border border-[#95d3ba]/60 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#003527]" />
                    <span>Quote Accepted</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={acceptingQuoteId === quote.id}
                    onClick={() => handleAccept(quote.id)}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#003527] hover:bg-[#064e3b] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{acceptingQuoteId === quote.id ? 'Processing...' : 'Accept & Book'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
