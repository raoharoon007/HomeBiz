export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'UPCOMING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type RequestStatus = 'OPEN' | 'QUOTED' | 'ACCEPTED' | 'CLOSED' | 'CANCELLED';

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type ReviewStatus = 'PUBLISHED' | 'FLAGGED' | 'HIDDEN';

export type VendorStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' | 'CASH_ON_DELIVERY';

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'NEW_REQUEST'
  | 'NEW_QUOTE'
  | 'QUOTE_ACCEPTED'
  | 'NEW_MESSAGE'
  | 'REVIEW_REMINDER'
  | 'VENDOR_APPROVAL'
  | 'SYSTEM_ANNOUNCEMENT';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  city: string;
  address?: string;
  createdAt: string;
  sellerProfileId?: string;
}

export interface City {
  id: string;
  name: string;
  province: string;
  popularAreas: string[];
  vendorCount: number;
  featured?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  image: string;
  vendorCount: number;
  subcategories: string[];
  featured?: boolean;
}

export interface ServiceAddon {
  id: string;
  name: string;
  price: number; // in PKR
  description?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number; // in PKR
  duration?: string;
  noticePeriod: string;
  image: string;
  category: string;
  addons: ServiceAddon[];
  isPopular?: boolean;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  subcategories: string[];
  city: string;
  locality: string;
  exactAddress?: string; // Hidden by default for privacy
  showExactAddress?: boolean;
  coverImage: string;
  avatar: string;
  gallery: string[];
  startingPrice: number; // in PKR
  rating: number;
  reviewCount: number;
  responseTime: string;
  experienceYears: number;
  status: VendorStatus;
  verificationStatus: VerificationStatus;
  isFeatured?: boolean;
  serviceAreas: string[];
  specialties: string[];
  services: ServiceItem[];
  availabilityNotice: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  currentPlan?: SubscriptionPlan; // Current subscription plan
  subscriptionId?: string; // Reference to SellerSubscription
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  date: string;
  timeSlot: string;
  notes?: string;
  deliveryAddress?: string;
  deliveryType: 'DELIVERY' | 'PICKUP' | 'AT_HOME';
  selectedAddons: ServiceAddon[];
  subtotal: number;
  addonsTotal: number;
  platformFee: number;
  discount: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'JAZZCASH_EASYPAISA' | 'CARD';
  transactionId?: string;
  createdAt: string;
  reviewId?: string;
}

export interface CustomerRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  category: string;
  serviceNeeded: string;
  city: string;
  area: string;
  preferredDate: string;
  budget: number;
  guestCountOrQuantity?: string;
  description: string;
  deliveryMethod: 'DELIVERY' | 'PICKUP' | 'AT_HOME';
  status: RequestStatus;
  photos: string[];
  createdAt: string;
  quoteCount: number;
}

export interface QuoteItem {
  name: string;
  cost: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  requestId: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorAvatar: string;
  vendorRating: number;
  vendorReviewCount: number;
  price: number;
  serviceFee: number;
  deliveryFee: number;
  totalPrice: number;
  itemsBreakdown: QuoteItem[];
  estimatedCompletion: string;
  message: string;
  validUntil: string;
  status: QuoteStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  attachmentUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  }[];
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  customerId?: string;
  customerName?: string;
  customerAvatar?: string;
  contextType?: 'BOOKING' | 'REQUEST' | 'GENERAL';
  contextId?: string;
  contextTitle?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCountCustomer: number;
  unreadCountVendor: number;
}

export interface Review {
  id: string;
  vendorId: string;
  bookingId?: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  sellerReply?: {
    text: string;
    repliedAt: string;
  };
  status: ReviewStatus;
}

export interface Favorite {
  id: string;
  customerId: string;
  vendorId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  vendorId: string;
  title: string;
  code: string;
  discountPercent: number;
  validUntil: string;
  active: boolean;
  usageCount: number;
}

export interface Report {
  id: string;
  reportedByUserId: string;
  targetType: 'VENDOR' | 'REVIEW' | 'USER';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface CommissionSettings {
  defaultPercentage: number;
  featuredListingFee: number;
  payoutThreshold: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  coverImage: string;
  category: string;
  publishedAt: string;
  readTime: string;
}

export type Vendor = VendorProfile;

export type SubscriptionPlan = 'free' | 'pro' | 'featured';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  slug: SubscriptionPlan;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  icon: string;
  cta: string;
  highlighted?: boolean;
  badge?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerSubscription {
  id: string;
  vendorId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  billingPeriod: 'monthly' | 'yearly';
  priceAtPurchase: number;
  startDate: string;
  renewalDate: string;
  paymentMethod: 'JAZZ_CASH' | 'EASYPAISA' | 'CARD' | 'BANK_TRANSFER' | 'MANUAL';
  paymentStatus: PaymentStatus;
  transactionId?: string;
  providerReference?: string;
  lastPaymentAt?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}
