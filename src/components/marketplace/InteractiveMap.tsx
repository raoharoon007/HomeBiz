import React, { useState, useEffect, useRef } from 'react';
import { VendorProfile } from '../../types';
import { Link } from '../../lib/navigation';
import { Star, MapPin, ZoomIn, ZoomOut, Navigation, Sparkles, X } from 'lucide-react';
import { formatPrice } from '../../lib/countryUtils';

interface InteractiveMapProps {
  vendors: VendorProfile[];
  selectedCity: string;
  selectedVendorId?: string;
  onSelectVendor?: (vendorId: string) => void;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5973, lng: 73.0841 },
  Faisalabad: { lat: 31.4504, lng: 73.1350 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Sydney: { lat: -33.8688, lng: 151.2093 },
  Melbourne: { lat: -37.8136, lng: 144.9631 },
  Brisbane: { lat: -27.4698, lng: 153.0251 },
  Perth: { lat: -31.9505, lng: 115.8605 },
  Adelaide: { lat: -34.9285, lng: 138.6007 },
  Canberra: { lat: -35.2809, lng: 149.1300 },
};

export function InteractiveMap({
  vendors,
  selectedCity,
  selectedVendorId,
  onSelectVendor,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [activeVendor, setActiveVendor] = useState<VendorProfile | null>(() => {
    if (selectedVendorId) {
      return vendors.find((v) => v.id === selectedVendorId) || null;
    }
    return vendors[0] || null;
  });

  const [searchAsMove, setSearchAsMove] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS dynamically if not already loaded
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Keep script in head for efficiency
    };
  }, []);

  // Get default city center
  const getCityCenter = (cityName: string) => {
    const found = CITY_COORDINATES[cityName];
    if (found) return found;
    return CITY_COORDINATES['Lahore'];
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const center = getCityCenter(selectedCity);

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([center.lat, center.lng], 12);
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for vendors
    vendors.forEach((vendor, idx) => {
      let lat = vendor.coordinates?.lat;
      let lng = vendor.coordinates?.lng;

      // Fallback relative offset around city center if missing
      if (!lat || !lng) {
        const offsetLat = (idx % 3 - 1) * 0.02;
        const offsetLng = (Math.floor(idx / 3) - 1) * 0.02;
        lat = center.lat + offsetLat;
        lng = center.lng + offsetLng;
      }

      const isSelected = activeVendor?.id === vendor.id;

      const markerHtml = `
        <div class="hb-map-pin ${isSelected ? 'hb-map-pin-selected' : ''}" style="
          background: ${isSelected ? '#003527' : '#ffffff'};
          color: ${isSelected ? '#ffffff' : '#003527'};
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1.5px solid ${isSelected ? '#95d3ba' : 'rgba(0,53,39,0.3)'};
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <span>${formatPrice(vendor.startingPrice, vendor.city)}</span>
          ${vendor.isFeatured ? '<span style="color:#cca72f">★</span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-vendor-marker',
        html: markerHtml,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
      marker.on('click', () => {
        setActiveVendor(vendor);
        onSelectVendor?.(vendor.id);
        mapInstanceRef.current.panTo([lat, lng], { animate: true });
      });

      markersRef.current.push(marker);
    });

  }, [leafletLoaded, vendors, selectedCity, activeVendor?.id]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    const center = getCityCenter(selectedCity);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], 12);
    }
    if (vendors[0]) setActiveVendor(vendors[0]);
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#eef3f0] rounded-2xl overflow-hidden border border-[#e3e2e1] select-none">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Top Map Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-[#e3e2e1] flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#003527]" />
          <span className="text-xs font-bold text-[#1a1c1c]">{selectedCity || 'Pakistan'} Map Area</span>
        </div>

        <label className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-[#e3e2e1] flex items-center gap-2 text-xs font-medium text-[#404944] cursor-pointer">
          <input
            type="checkbox"
            checked={searchAsMove}
            onChange={(e) => setSearchAsMove(e.target.checked)}
            className="rounded text-[#003527] focus:ring-[#003527] w-3.5 h-3.5"
          />
          <span className="text-[11px] hidden sm:inline">Search as map moves</span>
        </label>
      </div>

      {/* Zoom / Navigation Widget */}
      <div className="absolute right-3 bottom-20 sm:bottom-6 flex flex-col gap-1.5 z-20">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full bg-white shadow-md border border-[#e3e2e1] flex items-center justify-center text-stone-700 hover:bg-[#f4f3f2] active:scale-95 transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full bg-white shadow-md border border-[#e3e2e1] flex items-center justify-center text-stone-700 hover:bg-[#f4f3f2] active:scale-95 transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-full bg-[#003527] text-white shadow-md flex items-center justify-center hover:bg-[#064e3b] active:scale-95 transition-all"
          title="Recenter Map"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Active Vendor Preview Card Overlay */}
      {activeVendor && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs z-30 animate-fade-in">
          <div className="bg-white rounded-2xl p-3 shadow-xl border border-[#e3e2e1] relative flex gap-3">
            <button
              onClick={() => setActiveVendor(null)}
              className="absolute top-2 right-2 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <img
              src={activeVendor.coverImage}
              alt={activeVendor.businessName}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1 text-[10px] text-[#cca72f] font-bold">
                <Star className="w-3 h-3 fill-[#cca72f]" />
                <span>{activeVendor.rating.toFixed(1)}</span>
                <span className="text-[#665d55]">({activeVendor.reviewCount})</span>
              </div>

              <h4 className="font-bold text-xs text-[#1a1c1c] truncate mt-0.5">
                {activeVendor.businessName}
              </h4>

              <p className="text-[11px] text-[#665d55] truncate">{activeVendor.locality}</p>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#003527]">
                  From {formatPrice(activeVendor.startingPrice, activeVendor.city)}
                </span>
                <Link
                  href={`/vendors/${activeVendor.slug}`}
                  className="text-[10px] font-bold text-white bg-[#003527] px-2.5 py-1 rounded-full hover:bg-[#064e3b] shadow-xs"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
