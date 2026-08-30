import React, { useState } from 'react';
import { useRouter, useSearchParams } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { CustomerRequest } from '../types';
import { Sparkles, MapPin, Calendar, PlusCircle, CheckCircle, UploadCloud, Users, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export function RequestPage() {
  useStorageSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const preselectedCategory = searchParams.get('category') || 'cakes-baking';

  const [category, setCategory] = useState(preselectedCategory);
  const [serviceNeeded, setServiceNeeded] = useState('');
  const [city, setCity] = useState(user?.city || 'Lahore');
  const [area, setArea] = useState('DHA Phase 5');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [budget, setBudget] = useState(12000);
  const [guestCount, setGuestCount] = useState('30-40 people');
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP' | 'AT_HOME'>('DELIVERY');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
  ]);
  const [submitting, setSubmitting] = useState(false);

  const categories = Storage.getCategories();
  const cities = Storage.getCities();

  // Matched vendors count in this category and city
  const matchingVendors = Storage.getVendors().filter(
    (v) => v.category === category && (v.city.toLowerCase() === city.toLowerCase() || city === 'All Cities')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceNeeded.trim() || !description.trim()) return;

    setSubmitting(true);
    const requestNumber = `REQ-PK-2024-${Math.floor(100 + Math.random() * 900)}`;

    const newRequest: CustomerRequest = {
      id: `req-${Date.now()}`,
      requestNumber,
      customerId: user?.id || `guest-${Date.now()}`,
      customerName: user?.name || 'Guest Customer',
      customerAvatar: user?.avatar,
      category,
      serviceNeeded,
      city,
      area,
      preferredDate,
      budget,
      guestCountOrQuantity: guestCount,
      description,
      deliveryMethod,
      status: 'OPEN',
      photos,
      createdAt: new Date().toISOString(),
      quoteCount: 0,
    };

    Storage.createRequest(newRequest);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      router.push(`/quotes/${newRequest.id}`);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003527] to-[#064e3b] text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b0f0d6]/20 text-[#b0f0d6] text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#ffe088]" />
          <span>HomeBiz Request Broadcast Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans']">
          Post a Custom Request
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl mt-1 leading-relaxed">
          Describe your bespoke event or service needs. We broadcast your request to vetted home creators in your city who reply with competitive quotes.
        </p>

        {/* Live Matching Creators Pill */}
        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-white border border-white/20">
          <Users className="w-4 h-4 text-[#ffe088]" />
          <span>
            <strong className="text-[#ffe088]">{matchingVendors.length} verified creators</strong> ready to quote in {city}
          </span>
        </div>
      </div>

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6">
        {/* Category & Service Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Select Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none font-semibold text-[#1a1c1c]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Service Headline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Tier Vintage Engagement Cake"
              value={serviceNeeded}
              onChange={(e) => setServiceNeeded(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>
        </div>

        {/* City, Locality & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none font-semibold text-[#1a1c1c]"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Area / Locality
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DHA Phase 5, Gulberg, Clifton"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Required Date
            </label>
            <input
              type="date"
              required
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none font-semibold text-[#1a1c1c]"
            />
          </div>
        </div>

        {/* Budget & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
                Target Budget (PKR)
              </label>
              <span className="text-xs font-black text-[#003527]">
                Rs. {budget.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="50000"
              step="1000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-[#003527] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Guest Count / Quantity / Dimensions
            </label>
            <input
              type="text"
              placeholder="e.g. 45-50 guests / 4 pounds / 3 suits"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
            Detailed Requirements
          </label>
          <textarea
            required
            rows={4}
            placeholder="Explain flavor preferences, themes, colors, dietary requirements (halal, organic, sugar-free), or specific timeline details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
          />
        </div>

        {/* Reference Image Attachments */}
        <div>
          <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
            Reference Photos & Inspiration
          </label>
          <div className="flex items-center gap-3">
            {photos.map((p, idx) => (
              <img
                key={idx}
                src={p}
                alt="Ref"
                className="w-16 h-16 rounded-xl object-cover border border-[#e3e2e1]"
              />
            ))}
            <button
              type="button"
              onClick={() =>
                setPhotos([
                  ...photos,
                  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
                ])
              }
              className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#003527] flex flex-col items-center justify-center text-stone-500 hover:text-[#003527] transition-colors"
            >
              <UploadCloud className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-bold">+ Add</span>
            </button>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-4 border-t border-[#f4f3f2] flex items-center justify-between">
          <span className="text-xs text-[#665d55]">No upfront payment required to post.</span>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all disabled:opacity-50"
          >
            <span>{submitting ? 'Broadcasting...' : 'Post Request & Get Quotes'}</span>
            <ArrowRight className="w-4 h-4 text-[#ffe088]" />
          </button>
        </div>
      </form>
    </div>
  );
}
