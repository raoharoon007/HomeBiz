import React from 'react';
import { Link } from '../../lib/navigation';
import { Storage } from '../../lib/storage';
import { Heart, ShieldCheck, Sparkles, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  const categories = Storage.getCategories();
  const cities = Storage.getCities();

  return (
    <footer className="bg-[#003527] text-white pt-16 pb-24 md:pb-12 border-t border-[#064e3b] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-800/60">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#b0f0d6] flex items-center justify-center text-[#003527] font-bold text-lg font-['Plus_Jakarta_Sans'] shadow-md">
                HB
              </div>
              <span className="font-bold text-2xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                HomeBiz
              </span>
            </div>

            <p className="text-emerald-100/80 text-sm max-w-sm leading-relaxed">
              Empowering home-based chefs, artisanal bakers, bespoke tailors, mehndi artists, and tutors to scale their craft with trusted local clients.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-xs text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-[#b0f0d6]" />
                <span>Verified Home Creators</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-xs text-emerald-200">
                <Sparkles className="w-4 h-4 text-[#ffe088]" />
                <span>0% Upfront Platform Fee</span>
              </div>
            </div>
          </div>

          {/* Categories Col */}
          <div>
            <h4 className="font-bold text-sm text-[#ffe088] uppercase tracking-wider mb-4">
              Explore Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/80">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="hover:text-white hover:underline transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities Col */}
          <div>
            <h4 className="font-bold text-sm text-[#ffe088] uppercase tracking-wider mb-4">
              Popular Cities
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/80">
              {cities.map((city) => (
                <li key={city.id}>
                  <Link
                    href={`/search?city=${encodeURIComponent(city.name)}`}
                    className="hover:text-white hover:underline transition-colors flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{city.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers & Support */}
          <div>
            <h4 className="font-bold text-sm text-[#ffe088] uppercase tracking-wider mb-4">
              Join Our Community
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/80">
              <li>
                <Link href="/become-a-seller" className="hover:text-white hover:underline transition-colors">
                  Become a HomeBiz Seller
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white hover:underline transition-colors">
                  How Ordering Works
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white hover:underline transition-colors">
                  Community Stories & Tips
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:underline transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-emerald-800/60 text-xs text-emerald-200/90 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#b0f0d6]" />
                <span>support@homebiz.pk</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#b0f0d6]" />
                <span>+92 300 0000000 (Lahore HQ)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
          <p>© {new Date().getFullYear()} HomeBiz. Handcrafted with local love across Pakistan and Australia.</p>
          <div className="flex items-center gap-1 text-emerald-100">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline" />
            <span>for Home Creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
