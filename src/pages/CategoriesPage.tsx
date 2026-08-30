import React from 'react';
import { Storage } from '../lib/storage';
import { CategoryCard } from '../components/marketplace/CategoryCard';
import { Sparkles } from 'lucide-react';

export function CategoriesPage() {
  const categories = Storage.getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
          Marketplace Directory
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
          All Service Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#665d55]">
          Explore trusted home chefs, artisanal bakers, bespoke tailors, organic mehndi artists, and academic tutors across Pakistan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} variant="card" />
        ))}
      </div>
    </div>
  );
}
