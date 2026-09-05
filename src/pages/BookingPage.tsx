import React, { useState } from 'react';
import { usePathname, useSearchParams, useRouter, Link } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { ServiceItem, ServiceAddon, Booking } from '../types';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendBookingConfirmationEmail } from '../lib/emailService';
import { PaymentGateway, PaymentResult } from '../components/marketplace/PaymentGateway';
import { validateForm, bookingDetailsSchema } from '../lib/validationSchemas';
import { isAustralianLocation, formatCurrency, SupportedCurrency } from '../lib/countryUtils';

export function BookingPage() {
  useStorageSubscription();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white rounded-3xl p-8 border border-[#e3e2e1] space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#FFF1E7] text-[#735c00] mx-auto flex items-center justify-center font-bold text-lg">
          🔒
        </div>
        <h2 className="text-xl font-bold text-[#1a1c1c]">Sign in to book this service</h2>
        <p className="text-xs text-[#665d55] leading-relaxed">
          Please log in to confirm your order details and complete your booking securely.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <a href="/auth/login" onClick={(e) => { e.preventDefault(); router.push('/auth/login'); }} className="px-6 py-2.5 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]">
            Sign In
          </a>
          <a href="/auth/register" onClick={(e) => { e.preventDefault(); router.push('/auth/register'); }} className="px-6 py-2.5 rounded-full bg-[#faf9f8] border border-[#e3e2e1] text-[#003527] text-xs font-bold hover:bg-[#f4f3f2]">
            Create Account
          </a>
        </div>
      </div>
    );
  }

  // Extract vendorId from /booking/:id
  const vendorId = pathname.replace('/booking/', '').split('?')[0];
  const vendor = Storage.getVendorById(vendorId) || Storage.getVendors()[0];

  const fallbackService: ServiceItem = {
    id: 'custom-order',
    title: `${vendor.businessName} - Bespoke Order / Slot Booking`,
    description: vendor.tagline || vendor.description || 'Custom home business booking and service slot tailored to your event or personal requirements.',
    price: vendor.startingPrice || 1500,
    duration: 'Custom schedule',
    noticePeriod: vendor.availabilityNotice || '24-48 hours notice',
    image: vendor.coverImage || vendor.avatar || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    category: vendor.category,
    addons: [
      { id: 'addon-fast-track', name: 'Priority / Same-Day Fast Track Prep', price: 500, description: 'Expedited processing and preparation' },
      { id: 'addon-gift-wrap', name: 'Gift Box & Custom Ribbon Packaging', price: 350, description: 'Celebration-ready luxury presentation' },
    ],
  };

  const availableServices = (vendor.services && vendor.services.length > 0) ? vendor.services : [fallbackService];

  const preselectedServiceId = searchParams.get('serviceId');
  const initialService =
    availableServices.find((s) => s.id === preselectedServiceId) || availableServices[0];

  // Stepper state: 1 to 6
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceItem>(initialService);
  const [selectedAddons, setSelectedAddons] = useState<ServiceAddon[]>([]);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('02:00 PM - 04:00 PM');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP' | 'AT_HOME'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'House 142, Phase 5 DHA, Lahore');
  const [notes, setNotes] = useState('');

  // Australia Location & Currency Detection
  const isVendorAustralian = isAustralianLocation(vendor.city) || isAustralianLocation(vendor.locality) || isAustralianLocation(vendor.exactAddress);
  const isCustomerAustralian = isAustralianLocation(user?.city) || isAustralianLocation(deliveryAddress);
  const isAustralia = isVendorAustralian || isCustomerAustralian;
  const bookingCurrency: SupportedCurrency = isAustralia ? 'AUD' : 'PKR';

  const [paymentMethod, setPaymentMethod] = useState<Booking['paymentMethod']>(isAustralia ? 'PAYPAL' : 'CASH_ON_DELIVERY');
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const timeSlots = [
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
  ];

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = selectedService?.price ?? initialService.price;
  const platformFee = isAustralia ? 5 : 150;
  const grandTotal = subtotal + addonsTotal + platformFee;

  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const createAndSaveBooking = (txnId?: string, overrideMethod?: Booking['paymentMethod']) => {
    const finalPaymentMethod = overrideMethod || paymentMethod;
    const prefix = isAustralia ? 'HB-AU' : 'HB-PK';
    const bookingNumber = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingNumber,
      customerId: user?.id || `guest-${Date.now()}`,
      customerName: user?.name || 'Guest Customer',
      customerPhone: user?.phone || (isAustralia ? '+61 400 123 456' : '+92 300 1234567'),
      customerEmail: user?.email || 'guest@homebiz.pk',
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorSlug: vendor.slug,
      serviceId: selectedService?.id || initialService.id,
      serviceTitle: selectedService?.title || initialService.title,
      serviceImage: selectedService?.image || initialService.image || vendor.coverImage || vendor.avatar,
      date: bookingDate,
      timeSlot,
      notes,
      deliveryAddress,
      deliveryType,
      selectedAddons,
      subtotal,
      addonsTotal,
      platformFee,
      discount: 0,
      total: grandTotal,
      status: 'CONFIRMED',
      paymentStatus: (finalPaymentMethod === 'PAYPAL' || finalPaymentMethod === 'CARD') ? 'PAID' : 'PENDING',
      paymentMethod: finalPaymentMethod,
      transactionId: txnId,
      createdAt: new Date().toISOString(),
    };

    Storage.createBooking(newBooking);
    sendBookingConfirmationEmail(newBooking);
    setCreatedBooking(newBooking);
    setStep(6);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const handleConfirmOrder = () => {
    // Online escrow payment methods open the PaymentGateway modal
    if (paymentMethod === 'PAYPAL' || paymentMethod === 'JAZZCASH_EASYPAISA' || paymentMethod === 'CARD' || paymentMethod === 'BANK_TRANSFER') {
      setShowPaymentGateway(true);
    } else {
      createAndSaveBooking();
    }
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setShowPaymentGateway(false);
    setPendingTransactionId(result.transactionId);

    let resolvedMethod: Booking['paymentMethod'] = 'PAYPAL';
    if (result.paymentMethod === 'PAYPAL') resolvedMethod = 'PAYPAL';
    else if (result.paymentMethod === 'BANK_TRANSFER') resolvedMethod = 'BANK_TRANSFER';
    else if (result.paymentMethod === 'CARD') resolvedMethod = 'CARD';
    else if (result.paymentMethod === 'JAZZ_CASH' || result.paymentMethod === 'EASYPAISA') resolvedMethod = 'JAZZCASH_EASYPAISA';

    createAndSaveBooking(result.transactionId, resolvedMethod);
  };

  const stepLabels = ['Service', 'Date & Time', 'Details', 'Review', 'Payment', 'Confirmed'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <PaymentGateway
          planName={`${selectedService?.title || initialService.title} by ${vendor.businessName}`}
          amount={grandTotal}
          planSlug={selectedService?.id || initialService.id}
          currency={bookingCurrency}
          isAustralia={isAustralia}
          initialMethod={
            paymentMethod === 'PAYPAL'
              ? 'paypal'
              : paymentMethod === 'BANK_TRANSFER'
              ? 'bank_transfer'
              : paymentMethod === 'CARD'
              ? 'card'
              : isAustralia
              ? 'paypal'
              : 'jazz_cash'
          }
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentGateway(false)}
        />
      )}
      {/* STEPPER HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {stepLabels.map((lbl, idx) => {
            const stepNum = idx + 1;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;

            return (
              <div
                key={lbl}
                onClick={() => {
                  if (stepNum < step && step !== 6) {
                    setStep(stepNum);
                  }
                }}
                className={`flex items-center gap-2 flex-shrink-0 ${
                  stepNum < step && step !== 6 ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${isDone
                    ? 'bg-[#003527] text-white'
                    : isCurrent
                      ? 'bg-[#ffe088] text-[#735c00] ring-4 ring-[#ffe088]/30 font-black'
                      : 'bg-[#f4f3f2] text-[#665d55]'
                    }`}
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${isCurrent ? 'text-[#003527] font-bold' : 'text-[#665d55]'
                    }`}
                >
                  {lbl}
                </span>
                {stepNum < 6 && <div className="w-6 sm:w-12 h-0.5 bg-[#f4f3f2] mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: SERVICE & ADD-ONS */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Select Package & Add-ons
            </h2>
            <p className="text-xs text-[#665d55]">Ordering from {vendor.businessName}</p>
          </div>

          {vendor.services.length === 0 && (
            <div className="p-4 bg-[#b0f0d6]/20 border border-[#95d3ba]/50 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#003527] shrink-0 mt-0.5" />
              <div className="text-xs text-[#003527]">
                <strong className="block font-bold mb-0.5">Bespoke Creator Slot Booking</strong>
                <p>This home business takes custom orders directly. Select this slot, pick your preferred date and time, and describe any specific flavors, portions, or styling in the details step.</p>
              </div>
            </div>
          )}

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableServices.map((srv) => {
              const isSelected = (selectedService?.id || initialService.id) === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                    ? 'border-[#003527] bg-[#b0f0d6]/10 shadow-md'
                    : 'border-[#e3e2e1] hover:border-stone-400'
                    }`}
                >
                  <img src={srv.image} alt={srv.title} className="w-full h-32 rounded-xl object-cover mb-3" />
                  <h3 className="font-bold text-sm text-[#1a1c1c]">{srv.title}</h3>
                  <p className="text-xs text-[#404944] mt-1 line-clamp-2">{srv.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#003527]">
                      {formatCurrency(srv.price, bookingCurrency)}
                    </span>
                    <span className="text-[10px] text-[#665d55]">{srv.noticePeriod}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add-ons Selector */}
          {selectedService?.addons && selectedService.addons.length > 0 && (
            <div className="pt-4 border-t border-[#f4f3f2] space-y-3">
              <h3 className="font-bold text-sm text-[#1a1c1c]">Optional Add-ons & Extras</h3>
              <div className="space-y-2">
                {selectedService.addons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-[#FFF1E7] border-[#ffe088]' : 'bg-[#faf9f8] border-[#e3e2e1]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon)}
                          className="rounded text-[#003527] focus:ring-[#003527] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#1a1c1c] block">{addon.name}</span>
                          {addon.description && (
                            <span className="text-[10px] text-[#665d55]">{addon.description}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#003527]">
                        + {formatCurrency(addon.price, bookingCurrency)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Continue to Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Choose Date & Time Slot
            </h2>
            <p className="text-xs text-[#665d55]">Creator notice requirement: {selectedService.noticePeriod}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                Booking Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none font-semibold text-[#1a1c1c]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
                Preferred Time Slot
              </label>
              <div className="grid grid-cols-1 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`text-xs p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${timeSlot === slot
                      ? 'bg-[#003527] text-white font-bold border-[#003527]'
                      : 'bg-[#faf9f8] text-[#1a1c1c] border-[#e3e2e1] hover:bg-[#f4f3f2]'
                      }`}
                  >
                    <span>{slot}</span>
                    {timeSlot === slot && <CheckCircle className="w-4 h-4 text-[#b0f0d6]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-xs font-bold text-[#404944]"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Delivery Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DETAILS & ADDRESS */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Delivery & Special Instructions
            </h2>
            <p className="text-xs text-[#665d55]">Provide custom requirements and address</p>
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
              Delivery / Service Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'DELIVERY', label: 'Doorstep Delivery', icon: Truck },
                { id: 'AT_HOME', label: 'Home Visit', icon: Sparkles },
                { id: 'PICKUP', label: 'Self Pickup', icon: MapPin },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDeliveryType(m.id as any)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-colors ${deliveryType === m.id
                      ? 'bg-[#FFF1E7] border-[#ffe088] font-bold text-[#735c00]'
                      : 'bg-[#faf9f8] border-[#e3e2e1] text-[#404944]'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address or Pickup info */}
          {deliveryType === 'PICKUP' ? (
            <div className="p-4 bg-[#003527]/5 border border-[#003527]/20 rounded-2xl flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#003527] shrink-0 mt-0.5" />
              <div className="text-xs text-[#003527]">
                <strong className="block font-bold mb-0.5">Self Pickup from Creator Studio / Kitchen</strong>
                <p className="text-[#404944]">
                  You will collect this order directly from <strong>{vendor.businessName}</strong> in{' '}
                  {vendor.locality ? `${vendor.locality}, ${vendor.city}` : vendor.city || 'the designated studio area'}. Exact pickup directions and contact will be provided upon confirmation.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                Full Street Address & Landmark <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  if (deliveryErrors.deliveryAddress) setDeliveryErrors(prev => ({ ...prev, deliveryAddress: '' }));
                }}
                placeholder="e.g. House 142, Street 7, Phase 5 DHA, Lahore"
                className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                  deliveryErrors.deliveryAddress
                    ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                    : 'border-[#e3e2e1] focus:border-[#003527]'
                }`}
              />
              {deliveryErrors.deliveryAddress && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {deliveryErrors.deliveryAddress}
                </p>
              )}
            </div>
          )}

          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Custom Notes (Cake text message, colors, dietary preferences)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (deliveryErrors.notes) setDeliveryErrors(prev => ({ ...prev, notes: '' }));
              }}
              placeholder="e.g. Please write 'Happy 25th Birthday Maham!' in cursive pastel pink."
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                deliveryErrors.notes
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {deliveryErrors.notes && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {deliveryErrors.notes}
              </p>
            )}
          </div>

          {/* Global error banner if anything fails */}
          {Object.keys(deliveryErrors).length > 0 && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>Please review: {Object.values(deliveryErrors).filter(Boolean).join(', ')}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-xs font-bold text-[#404944] hover:bg-stone-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              id="review-order-btn"
              onClick={async () => {
                const finalAddress = deliveryType === 'PICKUP'
                  ? (deliveryAddress.trim() || `Self Pickup from ${vendor.businessName}`)
                  : deliveryAddress.trim();

                const { isValid, errors } = await validateForm(bookingDetailsSchema, {
                  deliveryType,
                  deliveryAddress: finalAddress,
                  bookingDate,
                  timeSlot,
                  notes,
                });

                if (!isValid) {
                  setDeliveryErrors(errors);
                  return;
                }

                if (deliveryType === 'PICKUP' && !deliveryAddress.trim()) {
                  setDeliveryAddress(finalAddress);
                }

                setDeliveryErrors({});
                setStep(4);
              }}
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <span>Review Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW SUMMARY */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Review Your Booking
            </h2>
            <p className="text-xs text-[#665d55]">Check pricing breakdown before proceeding to payment</p>
          </div>

          <div className="p-4 bg-[#faf9f8] rounded-2xl border border-[#e3e2e1] flex items-center gap-4">
            <img
              src={selectedService?.image || initialService.image}
              alt={selectedService?.title || initialService.title}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-sm text-[#1a1c1c]">{selectedService?.title || initialService.title}</h3>
              <p className="text-xs text-[#665d55]">By {vendor.businessName}</p>
              <p className="text-xs text-[#003527] font-semibold mt-1">
                📅 {bookingDate} • ⏰ {timeSlot}
              </p>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="space-y-2 border-y border-[#f4f3f2] py-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[#404944]">Base Service Fee</span>
              <span className="font-semibold text-stone-900">{formatCurrency(subtotal, bookingCurrency)}</span>
            </div>
            {selectedAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between">
                <span className="text-[#404944]">+ {addon.name}</span>
                <span className="font-semibold text-stone-900">{formatCurrency(addon.price, bookingCurrency)}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-[#404944]">HomeBiz SafeGuarantee Protection</span>
              <span className="font-semibold text-stone-900">{formatCurrency(platformFee, bookingCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-[#003527] pt-2 border-t border-[#f4f3f2]">
              <span>Total Payable ({bookingCurrency})</span>
              <span>{formatCurrency(grandTotal, bookingCurrency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-xs font-bold text-[#404944]"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: PAYMENT METHOD */}
      {step === 5 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
                Select Payment Method
              </h2>
              <p className="text-xs text-[#665d55]">Total Amount: {formatCurrency(grandTotal, bookingCurrency)}</p>
            </div>
            {isAustralia && (
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                🇦🇺 Australian Order (Pay in AUD)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {(isAustralia
              ? [
                  {
                    id: 'PAYPAL',
                    title: '🅿️ PayPal (Australia & International)',
                    desc: 'Instant checkout in AUD via PayPal balance, card, or linked Australian bank with Buyer Protection.',
                    badge: '🇦🇺 Recommended for Australia',
                    badgeClass: 'bg-[#ffc439] text-[#003087]',
                  },
                  {
                    id: 'CARD',
                    title: '💳 Visa / Mastercard / Amex Debit Card',
                    desc: 'Encrypted credit or debit card gateway in AUD.',
                  },
                  {
                    id: 'BANK_TRANSFER',
                    title: '🏛️ Bank Transfer / Askari Bank Escrow',
                    desc: 'Official platform bank transfer with receipt verification.',
                  },
                  {
                    id: 'CASH_ON_DELIVERY',
                    title: '💵 Cash on Delivery (COD)',
                    desc: 'Pay cash in AUD directly to creator upon doorstep delivery.',
                  },
                ]
              : [
                  {
                    id: 'CASH_ON_DELIVERY',
                    title: 'Cash on Delivery (COD)',
                    desc: 'Pay cash in PKR directly to creator upon receipt.',
                  },
                  {
                    id: 'JAZZCASH_EASYPAISA',
                    title: 'JazzCash / Easypaisa Mobile Wallet',
                    desc: 'Instant mobile account payment (0309 2266482 - Erum Nazir).',
                  },
                  {
                    id: 'BANK_TRANSFER',
                    title: 'Direct Online Bank Transfer (IBFT)',
                    desc: 'Transfer directly to verified Askari Commercial Bank escrow account.',
                  },
                  {
                    id: 'CARD',
                    title: 'Visa / Mastercard Debit Card',
                    desc: 'Encrypted payment gateway serving Pakistan and international cards.',
                  },
                  {
                    id: 'PAYPAL',
                    title: '🅿️ PayPal (Overseas / Australian Buyers)',
                    desc: 'Ordering from Australia or abroad for family in Pakistan? Pay via PayPal.',
                    badge: '🌍 International',
                    badgeClass: 'bg-blue-100 text-[#003087]',
                  },
                ]
            ).map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                    ? method.id === 'PAYPAL'
                      ? 'border-[#0070ba] bg-[#0070ba]/5 ring-1 ring-[#0070ba]/20'
                      : 'border-[#003527] bg-[#b0f0d6]/10'
                    : 'border-[#e3e2e1] hover:border-stone-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={isSelected}
                    onChange={() => setPaymentMethod(method.id as any)}
                    className="mt-0.5 text-[#003527] focus:ring-[#003527]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-xs sm:text-sm text-[#1a1c1c] block">
                        {method.title}
                      </span>
                      {'badge' in method && method.badge && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${'badgeClass' in method ? (method as any).badgeClass : 'bg-emerald-100 text-emerald-800'}`}>
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#665d55] mt-0.5 block">{method.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-xs font-bold text-[#404944]"
            >
              Back
            </button>
            <button
              onClick={handleConfirmOrder}
              className={`px-8 py-3.5 rounded-full text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all ${
                paymentMethod === 'PAYPAL'
                  ? 'bg-[#0070ba] hover:bg-[#003087]'
                  : 'bg-[#003527] hover:bg-[#064e3b]'
              }`}
            >
              <span>{paymentMethod === 'PAYPAL' ? 'Proceed with PayPal' : 'Confirm & Place Order'}</span>
              <CheckCircle className="w-4 h-4 text-[#ffe088]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CONFIRMATION */}
      {step === 6 && createdBooking && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#003527] shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#003527] bg-[#b0f0d6]/30 px-3 py-1 rounded-full">
              Booking Confirmed 🎉
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] mt-2">
              Thank You, {createdBooking.customerName}!
            </h2>
            <p className="text-xs sm:text-sm text-[#665d55] max-w-md mx-auto">
              Your order <strong className="text-[#003527]">#{createdBooking.bookingNumber}</strong> has been received by{' '}
              <strong>{vendor.businessName}</strong>.
            </p>
          </div>

          <div className="p-4 bg-[#faf9f8] rounded-2xl max-w-md mx-auto border border-[#e3e2e1] text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-[#665d55]">Service:</span>
              <span className="font-bold text-[#1a1c1c]">{createdBooking.serviceTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#665d55]">Scheduled For:</span>
              <span className="font-bold text-[#003527]">{createdBooking.date} ({createdBooking.timeSlot})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#665d55]">Total Amount:</span>
              <span className="font-extrabold text-stone-900">{formatCurrency(createdBooking.total, bookingCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#665d55]">Payment Method:</span>
              <span className="font-semibold text-stone-800">
                {createdBooking.paymentMethod === 'PAYPAL' ? '🅿️ PayPal (Live Automatic)' : createdBooking.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#665d55]">Payment Status:</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                createdBooking.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {createdBooking.paymentStatus === 'PAID' ? '✓ Paid (Live Verified)' : '⏳ Verification Pending'}
              </span>
            </div>
            {createdBooking.transactionId && (
              <div className="flex justify-between">
                <span className="text-[#665d55]">Transaction Ref:</span>
                <span className="font-mono text-emerald-700 text-[11px] font-bold">{createdBooking.transactionId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/customer/dashboard/bookings"
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md"
            >
              View in My Bookings
            </Link>
            <button
              onClick={() => {
                if (user) {
                  const conv = Storage.getOrCreateConversation(user.id, vendor.id, {
                    type: 'BOOKING',
                    id: createdBooking.id,
                    title: `Order #${createdBooking.bookingNumber} (${createdBooking.serviceTitle})`,
                  });
                  router.push(`/customer/dashboard/messages?convId=${conv.id}`);
                } else {
                  router.push('/customer/dashboard/messages');
                }
              }}
              className="px-6 py-3 rounded-full border border-[#003527] text-[#003527] hover:bg-[#003527]/5 font-bold text-xs cursor-pointer"
            >
              Chat with Creator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
