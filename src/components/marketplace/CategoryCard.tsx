import React from 'react';
import { Link } from '../../lib/navigation';
import { Category } from '../../types';
import { Cake, Utensils, Sparkles, Palette, Scissors, Camera, BookOpen, Gift, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Cake,
  Utensils,
  Sparkles,
  Palette,
  Scissors,
  Camera,
  BookOpen,
  Gift,
};

interface CategoryCardProps {
  key?: React.Key;
  category: Category;
  variant?: 'pill' | 'card' | 'grid';
}

export function CategoryCard({ category, variant = 'card' }: CategoryCardProps) {
  const IconComponent = ICON_MAP[category.iconName] || Sparkles;

  if (variant === 'pill') {
    return (
      <Link
        href={`/categories/${category.slug}`}
        className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FFF1E7] border border-[#e3e2e1] hover:border-[#ffe088] shadow-xs transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-xl bg-[#003527]/5 group-hover:bg-[#003527] flex items-center justify-center transition-colors">
          <IconComponent className="w-4 h-4 text-[#003527] group-hover:text-white transition-colors" />
        </div>
        <div className="text-left">
          <span className="font-bold text-xs text-[#1a1c1c] block group-hover:text-[#003527] whitespace-nowrap">
            {category.name}
          </span>
          <span className="text-[10px] text-[#665d55] block">
            {category.vendorCount} sellers
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative rounded-2xl overflow-hidden bg-white border border-[#e3e2e1] hover:border-[#003527]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <div className="relative h-36 w-full overflow-hidden bg-stone-100">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
          <IconComponent className="w-4 h-4 text-[#003527]" />
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-sm leading-tight drop-shadow-xs">{category.name}</h3>
          <span className="text-[11px] text-emerald-200 font-medium">
            {category.vendorCount}+ Home Creators
          </span>
        </div>
      </div>

      <div className="p-3 bg-white flex-1 flex flex-col justify-between">
        <p className="text-[11px] text-[#404944] line-clamp-2 leading-relaxed">
          {category.description}
        </p>

        <div className="mt-2.5 pt-2 border-t border-[#f4f3f2] flex items-center justify-between text-[10px] text-[#003527] font-bold">
          <span>Explore listings</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
