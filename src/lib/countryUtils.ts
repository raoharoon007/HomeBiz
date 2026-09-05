/**
 * Country & Currency Detection Utilities for HomeBiz (Pakistan & Australia)
 */

export const AUSTRALIAN_CITIES = [
  'Sydney',
  'Melbourne',
  'Brisbane',
  'Perth',
  'Adelaide',
  'Canberra',
  'Gold Coast',
  'Newcastle',
  'Wollongong',
  'Hobart',
  'Geelong',
  'Townsville',
  'Cairns',
  'Darwin',
  'Toowoomba',
  'Ballarat',
  'Bendigo',
];

export const AUSTRALIAN_STATES = [
  'New South Wales',
  'Victoria',
  'Queensland',
  'Western Australia',
  'South Australia',
  'Australian Capital Territory',
  'Tasmania',
  'Northern Territory',
];

export const AUSTRALIAN_STATE_CODES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT', 'TAS', 'NT'];

/**
 * Checks if a given city, locality, address or country string represents an Australian location.
 */
export function isAustralianLocation(location?: string | null): boolean {
  if (!location) return false;
  const normalized = location.trim().toLowerCase();

  if (normalized.includes('australia') || normalized.includes('aus')) {
    return true;
  }

  // Check city match
  const matchesCity = AUSTRALIAN_CITIES.some((city) =>
    normalized.includes(city.toLowerCase())
  );
  if (matchesCity) return true;

  // Check state match
  const matchesState = AUSTRALIAN_STATES.some((state) =>
    normalized.includes(state.toLowerCase())
  );
  if (matchesState) return true;

  // Check state code match (e.g. "Sydney NSW" or ", VIC")
  const matchesCode = AUSTRALIAN_STATE_CODES.some((code) => {
    const regex = new RegExp(`\\b${code}\\b`, 'i');
    return regex.test(location);
  });
  if (matchesCode) return true;

  return false;
}

/**
 * Pricing for Subscription Plans across Regions
 */
export const REGIONAL_PLAN_PRICING = {
  PKR: {
    free: { monthly: 0, yearly: 0, label: 'Free' },
    pro: { monthly: 2999, yearly: 29990, label: 'PKR 2,999' },
    featured: { monthly: 5999, yearly: 59990, label: 'PKR 5,999' },
  },
  AUD: {
    free: { monthly: 0, yearly: 0, label: 'Free' },
    pro: { monthly: 19, yearly: 190, label: 'A$ 19' },
    featured: { monthly: 39, yearly: 390, label: 'A$ 39' },
  },
} as const;

export type SupportedCurrency = 'PKR' | 'AUD';

/**
 * Format currency with appropriate symbol
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = 'PKR'): string {
  if (currency === 'AUD') {
    return `A$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `Rs. ${amount.toLocaleString()}`;
}

/**
 * Convert PKR to estimated AUD for cross-border estimation (~1 AUD ≈ 180 PKR)
 */
export function convertPkrToAud(pkrAmount: number): number {
  return Math.max(1, Math.round((pkrAmount / 180) * 10) / 10);
}
