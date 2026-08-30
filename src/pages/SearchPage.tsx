import React, { useState, useMemo } from 'react';
import { useSearchParams } from '../lib/navigation';
import { Storage, useStorageSubscription } from '../lib/storage';
import { VendorCard } from '../components/marketplace/VendorCard';
import { FilterSidebar, FilterState } from '../components/marketplace/FilterSidebar';
import { InteractiveMap } from '../components/marketplace/InteractiveMap';
import { Search, MapPin, SlidersHorizontal, Map, List, ArrowUpDown } from 'lucide-react';

export function SearchPage() {
  useStorageSubscription();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlCity = searchParams.get('city') || '';
  const urlCategory = searchParams.get('category') || '';

  const [textSearch, setTextSearch] = useState(urlQuery);
  const [filters, setFilters] = useState<FilterState>({
    city: urlCity,
    category: urlCategory,
    maxPrice: 35000,
    minRating: 0,
    verifiedOnly: false,
    featuredOnly: false,
  });

  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'rating'>('recommended');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const allVendors = Storage.getVendors();

  // Filter logic
  const filteredVendors = useMemo(() => {
    return allVendors.filter((vendor) => {
      // Text search
      if (textSearch.trim()) {
        const q = textSearch.toLowerCase();
        const matchesName = vendor.businessName.toLowerCase().includes(q);
        const matchesTagline = vendor.tagline.toLowerCase().includes(q);
        const matchesCategory = vendor.category.toLowerCase().includes(q);
        const matchesSpecialties = vendor.specialties.some((s) => s.toLowerCase().includes(q));
        const matchesServices = vendor.services.some((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
        if (!matchesName && !matchesTagline && !matchesCategory && !matchesSpecialties && !matchesServices) {
          return false;
        }
      }

      // City
      if (filters.city && vendor.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      // Category
      if (filters.category && vendor.category !== filters.category) {
        return false;
      }

      // Price
      if (vendor.startingPrice > filters.maxPrice) {
        return false;
      }

      // Rating
      if (filters.minRating > 0 && vendor.rating < filters.minRating) {
        return false;
      }

      // Verified
      if (filters.verifiedOnly && vendor.verificationStatus !== 'VERIFIED') {
        return false;
      }

      // Featured
      if (filters.featuredOnly && !vendor.isFeatured) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.startingPrice - b.startingPrice;
      if (sortBy === 'price_high') return b.startingPrice - a.startingPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [allVendors, textSearch, filters, sortBy]);

  const handleResetFilters = () => {
    setTextSearch('');
    setFilters({
      city: '',
      category: '',
      maxPrice: 35000,
      minRating: 0,
      verifiedOnly: false,
      featuredOnly: false,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Search / Filter summary header */}
      <div className="bg-white rounded-2xl border border-[#e3e2e1] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input field */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search keywords, services, dishes..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 bg-[#f4f3f2] rounded-full border border-transparent focus:border-[#003527] focus:bg-white outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665d55]" />
        </div>

        {/* Sort & Mobile toggles */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden px-3.5 py-1.5 rounded-full border border-[#e3e2e1] bg-white text-xs font-semibold flex items-center gap-1.5 text-[#1a1c1c]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#003527]" />
            <span>Filters</span>
          </button>

          {/* Mobile List/Map Switcher */}
          <div className="lg:hidden flex items-center bg-[#f4f3f2] p-1 rounded-full border border-[#e3e2e1]">
            <button
              onClick={() => setMobileView('list')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                mobileView === 'list' ? 'bg-[#003527] text-white shadow-xs' : 'text-[#665d55]'
              }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" /> List
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                mobileView === 'map' ? 'bg-[#003527] text-white shadow-xs' : 'text-[#665d55]'
              }`}
            >
              <Map className="w-3.5 h-3.5 inline mr-1" /> Map
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#665d55]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-[#1a1c1c] outline-none cursor-pointer text-xs"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 3-Column Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 24% Filter Sidebar (Hidden on mobile unless toggled) */}
        <div
          className={`lg:col-span-3 ${
            mobileFilterOpen ? 'block' : 'hidden lg:block'
          } sticky top-24 z-20`}
        >
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            resultCount={filteredVendors.length}
          />
        </div>

        {/* Center Column: 46% Results Cards List */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#665d55]">
            <span>
              Showing <strong className="text-[#1a1c1c]">{filteredVendors.length}</strong> home businesses
            </span>
            {filters.city && (
              <span className="font-semibold text-[#003527] bg-[#b0f0d6]/30 px-2.5 py-0.5 rounded-full">
                in {filters.city}
              </span>
            )}
          </div>

          {filteredVendors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e3e2e1] p-12 text-center space-y-3">
              <Search className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-bold text-base text-[#1a1c1c]">No Businesses Found</h3>
              <p className="text-xs text-[#665d55] max-w-sm mx-auto">
                Try adjusting your city filter, category, or expanding your budget range.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-full bg-[#003527] text-white text-xs font-bold shadow-xs hover:bg-[#064e3b]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onMouseEnter={() => setSelectedVendorId(vendor.id)}
                  className={`transition-all ${
                    selectedVendorId === vendor.id ? 'ring-2 ring-[#003527] rounded-2xl' : ''
                  }`}
                >
                  <VendorCard vendor={vendor} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: 30% Interactive Sticky Map */}
        <div
          className={`lg:col-span-4 sticky top-24 h-[calc(100vh-140px)] min-h-[500px] ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <InteractiveMap
            vendors={filteredVendors}
            selectedCity={filters.city}
            selectedVendorId={selectedVendorId}
            onSelectVendor={setSelectedVendorId}
          />
        </div>
      </div>
    </div>
  );
}
