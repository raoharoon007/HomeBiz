import React, { useState } from 'react';
import { useRouter } from '../lib/navigation';
import { Storage } from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { Vendor } from '../types';
import { Store, CheckCircle, Sparkles, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { PricingCards } from '../components/marketplace/PricingCards';
import confetti from 'canvas-confetti';
import { validateForm, becomeSellerSchema } from '../lib/validationSchemas';

export function BecomeSellerPage() {
  const router = useRouter();
  const { user, loginAs } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('cakes-baking');
  const [city, setCity] = useState('Lahore');
  const [locality, setLocality] = useState('DHA Phase 5');
  const [startingPrice, setStartingPrice] = useState(3500);
  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const categories = Storage.getCategories();
  const cities = Storage.getCities();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Yup validation
    const { isValid, errors } = await validateForm(becomeSellerSchema, {
      businessName,
      tagline,
      category,
      city,
      locality,
      startingPrice,
      description,
      experienceYears,
    });

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      userId: user?.id || 'user-v1',
      businessName,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      tagline,
      category,
      subcategories: ['Custom Orders', 'Artisan Handcrafted'],
      city,
      locality,
      startingPrice,
      rating: 5.0,
      reviewCount: 1,
      status: 'APPROVED',
      isFeatured: false,
      verificationStatus: 'PENDING',
      coverImage:
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
      ],
      description,
      specialties: ['Custom Bespoke Orders', 'Fresh Ingredients', 'Fast Response'],
      serviceAreas: [locality, 'Gulberg', 'Model Town'],
      availabilityNotice: 'Accepting orders with 48h advance notice',
      responseTime: '< 30 mins',
      experienceYears,
      coordinates: {
        lat: 31.5204,
        lng: 74.3587,
      },
      services: [
        {
          id: `srv-${Date.now()}-1`,
          title: `Signature Custom Package`,
          description: `Handcrafted with love and attention to detail.`,
          price: startingPrice,
          category,
          image:
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
          noticePeriod: '48 hours notice',
          duration: 'Custom delivery',
          isPopular: true,
          addons: [
            {
              id: 'add-1',
              name: 'Gift Box Packaging with Ribbon',
              price: 350,
              description: 'Luxury ribboned packaging',
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    };

    Storage.registerVendor(newVendor);

    // Update current user to SELLER role
    if (user) {
      loginAs({
        ...user,
        role: 'SELLER',
        sellerProfileId: newVendor.id,
      });
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      router.push('/seller/dashboard/profile');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="bg-[#003527] text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b0f0d6]/20 text-[#b0f0d6] text-xs font-bold">
          <Store className="w-3.5 h-3.5 text-[#ffe088]" />
          <span>Seller Onboarding</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-['Plus_Jakarta_Sans']">
          Register Your Home Business on HomeBiz
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
          Create your verified profile in 2 minutes. Start receiving direct bookings, quote broadcasts, and customer messages from your local city.
        </p>
      </div>

      {/* Pricing Plans Section */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Choose Your Growth Plan
          </h2>
          <p className="text-xs sm:text-sm text-[#665d55] max-w-2xl mx-auto">
            Start free and upgrade anytime as your business grows. All plans include everything you need to manage bookings, receive customer requests, and build your verified profile.
          </p>
        </div>
        <PricingCards onSelectPlan={() => { }} showComparison={true} showToggle={false} />
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs space-y-6" noValidate>
        <div className="space-y-1 pb-3 border-b border-[#f4f3f2]">
          <h2 className="text-lg font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
            Business Details
          </h2>
          <p className="text-xs text-[#665d55]">Provide accurate information for your digital storefront.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Business / Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Sugar Bliss Bakery, Hira's Henna Art"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
              }}
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.businessName
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.businessName && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.businessName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Primary Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: '' }));
              }}
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none font-semibold text-[#1a1c1c] transition-colors ${
                fieldErrors.category
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.category}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
            Tagline / One-line Pitch
          </label>
          <input
            type="text"
            placeholder="e.g. Custom buttercream vintage cakes & gourmet brownies crafted fresh in DHA"
            value={tagline}
            onChange={(e) => {
              setTagline(e.target.value);
              if (fieldErrors.tagline) setFieldErrors(prev => ({ ...prev, tagline: '' }));
            }}
            className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
              fieldErrors.tagline
                ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                : 'border-[#e3e2e1] focus:border-[#003527]'
            }`}
          />
          {fieldErrors.tagline && (
            <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.tagline}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
              }}
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none font-semibold text-[#1a1c1c] transition-colors ${
                fieldErrors.city
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.city && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Locality / Neighborhood
            </label>
            <input
              type="text"
              placeholder="e.g. DHA Phase 5, Clifton, F-7"
              value={locality}
              onChange={(e) => {
                setLocality(e.target.value);
                if (fieldErrors.locality) setFieldErrors(prev => ({ ...prev, locality: '' }));
              }}
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
                fieldErrors.locality
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.locality && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.locality}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
              Starting Price (PKR)
            </label>
            <input
              type="number"
              step="500"
              value={startingPrice}
              onChange={(e) => {
                setStartingPrice(Number(e.target.value));
                if (fieldErrors.startingPrice) setFieldErrors(prev => ({ ...prev, startingPrice: '' }));
              }}
              className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none font-semibold text-[#1a1c1c] transition-colors ${
                fieldErrors.startingPrice
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-[#e3e2e1] focus:border-[#003527]'
              }`}
            />
            {fieldErrors.startingPrice && (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.startingPrice}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
            About Your Story & Craftsmanship
          </label>
          <textarea
            rows={4}
            placeholder="Tell customers about your kitchen/studio setup, hygiene standards, experience, and why they should choose your home business..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: '' }));
            }}
            className={`w-full text-xs p-3 bg-[#faf9f8] border rounded-2xl outline-none transition-colors ${
              fieldErrors.description
                ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                : 'border-[#e3e2e1] focus:border-[#003527]'
            }`}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#f4f3f2] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#003527] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>5% platform commission only upon successful orders.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all disabled:opacity-50"
          >
            <span>{submitting ? 'Creating Profile...' : 'Launch Home Business'}</span>
            <ArrowRight className="w-4 h-4 text-[#ffe088]" />
          </button>
        </div>
      </form>
    </div>
  );
}
