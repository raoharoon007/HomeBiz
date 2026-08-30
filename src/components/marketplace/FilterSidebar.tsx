import React from 'react';
import { Storage } from '../../lib/storage';
import { Star, CheckCircle, RotateCcw } from 'lucide-react';

export interface FilterState {
  city: string;
  category: string;
  maxPrice: number;
  minRating: number;
  verifiedOnly: boolean;
  featuredOnly: boolean;
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  resultCount: number;
}

export function FilterSidebar({ filters, onChange, onReset, resultCount }: FilterSidebarProps) {
  const categories = Storage.getCategories();
  const cities = Storage.getCities();

  const handleCityChange = (city: string) => {
    onChange({ ...filters, city });
  };

  const handleCategoryChange = (category: string) => {
    onChange({ ...filters, category });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e3e2e1] p-5 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f4f3f2]">
        <div>
          <h3 className="font-bold text-sm text-[#1a1c1c]">Filter Listings</h3>
          <span className="text-[11px] text-[#665d55]">{resultCount} businesses match</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-[#003527] font-semibold hover:underline flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* City Filter */}
      <div>
        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
          City Location
        </label>
        <select
          value={filters.city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full text-xs bg-[#f4f3f2] border border-[#e3e2e1] rounded-xl px-3 py-2 text-[#1a1c1c] focus:outline-none focus:border-[#003527]"
        >
          <option value="">All Pakistani Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.name}>
              {city.name} ({city.province})
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
          Category
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          <button
            onClick={() => handleCategoryChange('')}
            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
              filters.category === ''
                ? 'bg-[#003527] text-white font-bold'
                : 'text-[#404944] hover:bg-[#f4f3f2]'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                filters.category === cat.slug
                  ? 'bg-[#003527] text-white font-bold'
                  : 'text-[#404944] hover:bg-[#f4f3f2]'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className={`text-[10px] ${filters.category === cat.slug ? 'text-white/80' : 'text-[#665d55]'}`}>
                {cat.vendorCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Maximum Starting Budget */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
            Max Starting Budget
          </label>
          <span className="text-xs font-extrabold text-[#003527]">
            Rs. {filters.maxPrice.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="35000"
          step="500"
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[#003527] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#665d55] mt-1">
          <span>Rs. 1,000</span>
          <span>Rs. 35,000+</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-2">
          Minimum Rating
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 4.5, 4.8].map((ratingVal) => (
            <button
              key={ratingVal}
              onClick={() => onChange({ ...filters, minRating: ratingVal })}
              className={`text-xs py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 border transition-all ${
                filters.minRating === ratingVal
                  ? 'bg-[#FFF1E7] text-[#735c00] border-[#ffe088] font-bold shadow-xs'
                  : 'bg-white text-[#404944] border-[#e3e2e1] hover:bg-[#f4f3f2]'
              }`}
            >
              {ratingVal === 0 ? (
                'Any'
              ) : (
                <>
                  <Star className="w-3 h-3 text-[#cca72f] fill-[#cca72f]" />
                  <span>{ratingVal}+</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="pt-2 border-t border-[#f4f3f2] space-y-3">
        <label className="flex items-center justify-between text-xs text-[#1a1c1c] cursor-pointer">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-[#003527]" />
            Verified Creators Only
          </span>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
            className="rounded text-[#003527] focus:ring-[#003527] w-4 h-4"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-[#1a1c1c] cursor-pointer">
          <span className="font-medium">Featured Top Picks</span>
          <input
            type="checkbox"
            checked={filters.featuredOnly}
            onChange={(e) => onChange({ ...filters, featuredOnly: e.target.checked })}
            className="rounded text-[#003527] focus:ring-[#003527] w-4 h-4"
          />
        </label>
      </div>
    </div>
  );
}
