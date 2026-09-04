import React, { useState } from 'react';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../lib/authContext';
import { Star, X, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateForm, addReviewSchema } from '../../lib/validationSchemas';

interface AddReviewModalProps {
  vendorId: string;
  vendorName: string;
  bookingId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddReviewModal({
  vendorId,
  vendorName,
  bookingId,
  isOpen,
  onClose,
  onSuccess,
}: AddReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Yup validation
    const { isValid, errors } = await validateForm(addReviewSchema, {
      rating,
      comment,
    });

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    Storage.addReview({
      vendorId,
      bookingId,
      customerId: user?.id || 'guest-cust',
      customerName: user?.name || 'Customer',
      customerAvatar: user?.avatar,
      rating,
      comment: comment.trim(),
    });

    setSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    });

    setTimeout(() => {
      onSuccess?.();
      onClose();
      setSubmitted(false);
      setComment('');
      setFieldErrors({});
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e3e2e1] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1c1c]">JazakAllah Khair!</h3>
            <p className="text-xs text-[#665d55]">Your review has been published and helps {vendorName} grow.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <span className="text-[11px] font-bold text-[#cca72f] uppercase tracking-wider">
                Leave a Verified Review
              </span>
              <h3 className="text-lg font-bold text-[#1a1c1c] mt-0.5">Rate {vendorName}</h3>
              <p className="text-xs text-[#665d55] mt-1">How was your experience with the service and quality?</p>
            </div>

            {/* Stars Selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-stone-300 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled ? 'text-[#cca72f] fill-[#cca72f]' : 'text-stone-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Your Feedback
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (fieldErrors.comment) setFieldErrors(prev => ({ ...prev, comment: '' }));
                }}
                placeholder="Describe the taste, quality, packaging, delivery punctuality, or craftsmanship..."
                className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-all ${
                  fieldErrors.comment
                    ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                    : 'border-[#e3e2e1] focus:border-[#003527] focus:bg-white'
                }`}
              />
              {fieldErrors.comment && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.comment}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#ffe088]" />
              <span>Submit Review</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
