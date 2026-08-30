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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendBookingConfirmationEmail } from '../lib/emailService';

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

  const preselectedServiceId = searchParams.get('serviceId');
  const initialService =
    vendor.services.find((s) => s.id === preselectedServiceId) || vendor.services[0];

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
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'JAZZCASH_EASYPAISA' | 'BANK_TRANSFER' | 'CARD'>('CASH_ON_DELIVERY');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  const timeSlots = [
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
  ];

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = selectedService.price;
  const platformFee = 150;
  const grandTotal = subtotal + addonsTotal + platformFee;

  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirmOrder = () => {
    const bookingNumber = `HB-PK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingNumber,
      customerId: user?.id || `guest-${Date.now()}`,
      customerName: user?.name || 'Guest Customer',
      customerPhone: user?.phone || '+92 300 1234567',
      customerEmail: user?.email || 'guest@homebiz.pk',
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorSlug: vendor.slug,
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      serviceImage: selectedService.image,
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
      paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID',
      paymentMethod,
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

  const stepLabels = ['Service', 'Date & Time', 'Details', 'Review', 'Payment', 'Confirmed'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* STEPPER HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-[#e3e2e1] shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {stepLabels.map((lbl, idx) => {
            const stepNum = idx + 1;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;

            return (
              <div key={lbl} className="flex items-center gap-2 flex-shrink-0">
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

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.services.map((srv) => {
              const isSelected = selectedService.id === srv.id;
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
                      Rs. {srv.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#665d55]">{srv.noticePeriod}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add-ons Selector */}
          {selectedService.addons && selectedService.addons.length > 0 && (
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
                        + Rs. {addon.price.toLocaleString()}
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

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Full Street Address & Landmark
            </label>
            <input
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. House 142, Street 7, Phase 5 DHA, Lahore"
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Custom Notes (Cake text message, colors, dietary preferences)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please write 'Happy 25th Birthday Maham!' in cursive pastel pink."
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-full border border-stone-300 text-xs font-bold text-[#404944]"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md flex items-center gap-2"
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
              src={selectedService.image}
              alt={selectedService.title}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-sm text-[#1a1c1c]">{selectedService.title}</h3>
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
              <span className="font-semibold text-stone-900">Rs. {subtotal.toLocaleString()}</span>
            </div>
            {selectedAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between">
                <span className="text-[#404944]">+ {addon.name}</span>
                <span className="font-semibold text-stone-900">Rs. {addon.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-[#404944]">HomeBiz SafeGuarantee Protection</span>
              <span className="font-semibold text-stone-900">Rs. {platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-[#003527] pt-2 border-t border-[#f4f3f2]">
              <span>Total Payable (PKR)</span>
              <span>Rs. {grandTotal.toLocaleString()}</span>
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
          <div>
            <h2 className="text-xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
              Select Payment Method
            </h2>
            <p className="text-xs text-[#665d55]">Total Amount: Rs. {grandTotal.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'CASH_ON_DELIVERY',
                title: 'Cash on Delivery (COD)',
                desc: 'Pay cash in PKR directly to creator upon receipt.',
              },
              {
                id: 'JAZZCASH_EASYPAISA',
                title: 'JazzCash / Easypaisa Mobile Wallet',
                desc: 'Instant mobile account payment with receipt confirmation.',
              },
              {
                id: 'BANK_TRANSFER',
                title: 'Direct Online Bank Transfer (IBFT)',
                desc: 'Transfer directly to verified HomeBiz escrow account.',
              },
              {
                id: 'CARD',
                title: 'Visa / Mastercard Debit Card',
                desc: 'Encrypted payment gateway powered by Pakistani merchant rails.',
              },
            ].map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${isSelected
                      ? 'border-[#003527] bg-[#b0f0d6]/10'
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
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[#1a1c1c] block">
                      {method.title}
                    </span>
                    <span className="text-xs text-[#665d55]">{method.desc}</span>
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
              className="px-8 py-3.5 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all"
            >
              <span>Confirm & Place Order</span>
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
              <span className="font-extrabold text-stone-900">Rs. {createdBooking.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#665d55]">Payment Method:</span>
              <span className="font-semibold text-stone-800">{createdBooking.paymentMethod}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/customer/dashboard/bookings"
              className="px-6 py-3 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md"
            >
              View in My Bookings
            </Link>
            <Link
              href="/customer/dashboard/messages"
              className="px-6 py-3 rounded-full border border-[#003527] text-[#003527] hover:bg-[#003527]/5 font-bold text-xs"
            >
              Chat with Creator
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
