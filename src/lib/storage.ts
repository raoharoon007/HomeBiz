import {
  User,
  VendorProfile,
  CustomerRequest,
  Quote,
  Booking,
  Conversation,
  Message,
  Review,
  Notification,
  Favorite,
  Category,
  City,
  CommissionSettings,
  BlogPost,
  ServiceItem,
  PricingPlan,
  SellerSubscription,
  SubscriptionPlan,
} from '../types';
import {
  SEED_USERS,
  SEED_VENDORS,
  SEED_CATEGORIES,
  SEED_CITIES,
  SEED_REQUESTS,
  SEED_QUOTES,
  SEED_BOOKINGS,
  SEED_REVIEWS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_COMMISSION_SETTINGS,
} from '../data/seedData';
import React, { useState, useEffect } from 'react';
import { SupabaseDb } from './supabaseDb';

const STORAGE_KEYS = {
  USERS: 'hb_users_v1',
  VENDORS: 'hb_vendors_v1',
  CATEGORIES: 'hb_categories_v1',
  CITIES: 'hb_cities_v1',
  REQUESTS: 'hb_requests_v1',
  QUOTES: 'hb_quotes_v1',
  BOOKINGS: 'hb_bookings_v1',
  REVIEWS: 'hb_reviews_v1',
  CONVERSATIONS: 'hb_conversations_v1',
  MESSAGES: 'hb_messages_v1',
  NOTIFICATIONS: 'hb_notifications_v1',
  FAVORITES: 'hb_favorites_v1',
  COMMISSIONS: 'hb_commissions_v1',
  PRICING_PLANS: 'hb_pricing_plans_v1',
  SUBSCRIPTIONS: 'hb_subscriptions_v1',
  ACTIVE_USER_ID: 'hb_active_user_id_v1',
};

// Memory fallback if localStorage is unavailable
const memoryStorage: Record<string, string> = {};

function safeGetItem<T>(key: string, defaultVal: T): T {
  try {
    const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : memoryStorage[key];
    if (!item) return defaultVal;
    return JSON.parse(item) as T;
  } catch {
    return defaultVal;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    const str = JSON.stringify(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, str);
    }
    memoryStorage[key] = str;
    // Dispatch custom event for cross-component reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hb_storage_update', { detail: { key } }));
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
}

function mergeSeedData<T extends { id?: string; name?: string }>(stored: T[] | null | undefined, seed: T[]): T[] {
  if (!stored) return seed;

  const built = [...stored];
  seed.forEach((item) => {
    const existingIndex = built.findIndex((storedItem) => {
      if (storedItem.id && item.id) return storedItem.id === item.id;
      return storedItem.name === item.name;
    });

    if (existingIndex >= 0) {
      built[existingIndex] = { ...stored[existingIndex], ...item };
    } else {
      built.push(item);
    }
  });

  return built;
}

// Initializer
export function initStorage() {
  if (typeof window === 'undefined') return;

  const storedVendors = safeGetItem(STORAGE_KEYS.VENDORS, null);
  const storedCities = safeGetItem(STORAGE_KEYS.CITIES, null);

  if (!storedVendors || !storedCities) {
    safeSetItem(STORAGE_KEYS.USERS, SEED_USERS);
    safeSetItem(STORAGE_KEYS.VENDORS, SEED_VENDORS);
    safeSetItem(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    safeSetItem(STORAGE_KEYS.CITIES, SEED_CITIES);
    safeSetItem(STORAGE_KEYS.REQUESTS, SEED_REQUESTS);
    safeSetItem(STORAGE_KEYS.QUOTES, SEED_QUOTES);
    safeSetItem(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS);
    safeSetItem(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
    safeSetItem(STORAGE_KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
    safeSetItem(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    safeSetItem(STORAGE_KEYS.COMMISSIONS, SEED_COMMISSION_SETTINGS);
    safeSetItem(STORAGE_KEYS.FAVORITES, [
      { id: 'fav-1', customerId: 'user-c1', vendorId: 'vendor-1', createdAt: new Date().toISOString() },
    ]);
    safeSetItem(STORAGE_KEYS.ACTIVE_USER_ID, null);
    return;
  }

  const mergedCities = mergeSeedData(storedCities, SEED_CITIES);
  const mergedVendors = mergeSeedData(storedVendors, SEED_VENDORS);

  if (mergedCities.length !== storedCities.length || mergedVendors.length !== storedVendors.length) {
    safeSetItem(STORAGE_KEYS.CITIES, mergedCities);
    safeSetItem(STORAGE_KEYS.VENDORS, mergedVendors);
  }
}

const getDefaultPasswordForEmail = (email: string): string => {
  const normalized = email.toLowerCase();
  if (normalized === 'fatima.malik@example.com') return 'customer123';
  if (normalized === 'ayesha.bake@example.com') return 'seller123';
  if (normalized === 'admin@homebiz.pk') return 'admin123';
  return '';
};

const migrateUsers = (users: User[]): User[] =>
  users.map((user) => ({
    ...user,
    password: user.password ?? getDefaultPasswordForEmail(user.email),
  }));

type UpgradeVendorPlanOptions = {
  billingPeriod?: SellerSubscription['billingPeriod'];
  paymentMethod?: SellerSubscription['paymentMethod'];
  paymentStatus?: SellerSubscription['paymentStatus'];
  priceAtPurchase?: number;
  transactionId?: string;
  providerReference?: string;
};

export const Storage = {
  // Users
  getUsers: (): User[] => migrateUsers(safeGetItem(STORAGE_KEYS.USERS, SEED_USERS)),
  getUserById: (id: string): User | undefined => Storage.getUsers().find((u) => u.id === id),
  saveUser: (user: User): void => {
    const users = Storage.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    safeSetItem(STORAGE_KEYS.USERS, users);
  },

  // Active User / Session
  getActiveUserId: (): string | null => safeGetItem<string | null>(STORAGE_KEYS.ACTIVE_USER_ID, null),
  setActiveUserId: (id: string | null): void => safeSetItem(STORAGE_KEYS.ACTIVE_USER_ID, id),
  getActiveUser: (): User | null => {
    const id = Storage.getActiveUserId();
    if (!id) return null;
    return Storage.getUserById(id) || null;
  },
  authenticateUser: (email: string, password?: string): User | undefined => {
    const users = Storage.getUsers();
    return users.find((u) => {
      const emailMatch = u.email.toLowerCase() === email.toLowerCase();
      if (!password) return emailMatch;
      return emailMatch && u.password === password;
    });
  },

  // Categories & Cities
  getCategories: (): Category[] => safeGetItem(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES),
  getCities: (): City[] => mergeSeedData(safeGetItem<City[] | null>(STORAGE_KEYS.CITIES, null), SEED_CITIES),

  // Vendors
  getVendors: (): VendorProfile[] => safeGetItem(STORAGE_KEYS.VENDORS, SEED_VENDORS),
  getVendorById: (id: string): VendorProfile | undefined => Storage.getVendors().find((v) => v.id === id),
  getVendorBySlug: (slug: string): VendorProfile | undefined => Storage.getVendors().find((v) => v.slug === slug),
  getVendorByUserId: (userId: string): VendorProfile | undefined => Storage.getVendors().find((v) => v.userId === userId),
  saveVendor: (vendor: VendorProfile): void => {
    const vendors = Storage.getVendors();
    const idx = vendors.findIndex((v) => v.id === vendor.id);
    if (idx >= 0) vendors[idx] = vendor;
    else vendors.push(vendor);
    safeSetItem(STORAGE_KEYS.VENDORS, vendors);
  },
  registerVendor: (vendor: VendorProfile): void => {
    const vendors = Storage.getVendors();
    vendors.unshift(vendor);
    safeSetItem(STORAGE_KEYS.VENDORS, vendors);
  },
  updateVendorVerification: (vendorId: string, status: VendorProfile['verificationStatus']): void => {
    const vendors = Storage.getVendors();
    const v = vendors.find((item) => item.id === vendorId);
    if (v) {
      v.verificationStatus = status;
      safeSetItem(STORAGE_KEYS.VENDORS, vendors);
    }
  },
  toggleVendorFeatured: (vendorId: string): void => {
    const vendors = Storage.getVendors();
    const v = vendors.find((item) => item.id === vendorId);
    if (v) {
      v.isFeatured = !v.isFeatured;
      safeSetItem(STORAGE_KEYS.VENDORS, vendors);
    }
  },
  addVendorService: (vendorId: string, service: ServiceItem): void => {
    const vendors = Storage.getVendors();
    const v = vendors.find((item) => item.id === vendorId);
    if (v) {
      v.services = [...v.services, service];
      safeSetItem(STORAGE_KEYS.VENDORS, vendors);
    }
  },

  // Bookings
  getBookings: (): Booking[] => safeGetItem(STORAGE_KEYS.BOOKINGS, SEED_BOOKINGS),
  getBookingById: (id: string): Booking | undefined => Storage.getBookings().find((b) => b.id === id),
  createBooking: (booking: Booking): void => {
    const bookings = Storage.getBookings();
    bookings.unshift(booking);
    safeSetItem(STORAGE_KEYS.BOOKINGS, bookings);

    // Sync to Supabase in background
    SupabaseDb.createBooking(booking).catch((e) => console.warn('Supabase booking sync error:', e));

    // Add notification for vendor
    const vendor = Storage.getVendorById(booking.vendorId);
    if (vendor) {
      Storage.createNotification({
        id: `notif-${Date.now()}`,
        userId: vendor.userId,
        title: 'New Booking Order 🛎️',
        message: `${booking.customerName} booked "${booking.serviceTitle}" for ${booking.date} (Rs. ${booking.total.toLocaleString()}).`,
        type: 'BOOKING_CREATED',
        link: '/seller/dashboard/bookings',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  },
  updateBookingStatus: (id: string, status: Booking['status']): void => {
    const bookings = Storage.getBookings();
    const booking = bookings.find((b) => b.id === id);
    if (booking) {
      booking.status = status;
      safeSetItem(STORAGE_KEYS.BOOKINGS, bookings);

      // Notify customer
      Storage.createNotification({
        id: `notif-${Date.now()}`,
        userId: booking.customerId,
        title: `Booking Update: ${status} 📋`,
        message: `Your booking #${booking.bookingNumber} with ${booking.vendorName} is now ${status.toLowerCase()}.`,
        type: status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
        link: '/customer/dashboard/bookings',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  },

  // Customer Requests
  getRequests: (): CustomerRequest[] => safeGetItem(STORAGE_KEYS.REQUESTS, SEED_REQUESTS),
  getRequestById: (id: string): CustomerRequest | undefined => Storage.getRequests().find((r) => r.id === id),
  createRequest: (request: CustomerRequest): void => {
    const requests = Storage.getRequests();
    requests.unshift(request);
    safeSetItem(STORAGE_KEYS.REQUESTS, requests);

    // Sync to Supabase in background
    SupabaseDb.createCustomerRequest(request).catch((e) => console.warn('Supabase request sync error:', e));

    // Notify matching sellers in that category and city
    const vendors = Storage.getVendors().filter(
      (v) => v.category === request.category && (v.city.toLowerCase() === request.city.toLowerCase() || request.city === 'All Cities')
    );
    vendors.forEach((v) => {
      Storage.createNotification({
        id: `notif-${Date.now()}-${v.id}`,
        userId: v.userId,
        title: 'New Customer Request Posted 📢',
        message: `${request.customerName} is looking for "${request.serviceNeeded}" in ${request.area || request.city} (Budget: Rs. ${request.budget.toLocaleString()}).`,
        type: 'NEW_REQUEST',
        link: '/seller/dashboard/requests',
        read: false,
        createdAt: new Date().toISOString(),
      });
    });
  },

  // Quotes
  getQuotes: (): Quote[] => safeGetItem(STORAGE_KEYS.QUOTES, SEED_QUOTES),
  getQuotesForRequest: (requestId: string): Quote[] => Storage.getQuotes().filter((q) => q.requestId === requestId),
  submitQuote: (quote: Quote): void => Storage.createQuote(quote),
  createQuote: (quote: Quote): void => {
    const quotes = Storage.getQuotes();
    quotes.unshift(quote);
    safeSetItem(STORAGE_KEYS.QUOTES, quotes);

    // Sync to Supabase in background
    SupabaseDb.createQuote(quote).catch((e) => console.warn('Supabase quote sync error:', e));

    // Update request count
    const requests = Storage.getRequests();
    const req = requests.find((r) => r.id === quote.requestId);
    if (req) {
      req.quoteCount = (req.quoteCount || 0) + 1;
      req.status = 'QUOTED';
      safeSetItem(STORAGE_KEYS.REQUESTS, requests);

      // Notify customer
      Storage.createNotification({
        id: `notif-${Date.now()}`,
        userId: req.customerId,
        title: 'New Quote Received! 💬',
        message: `${quote.vendorName} sent a customized quote of Rs. ${quote.totalPrice.toLocaleString()} for your request.`,
        type: 'NEW_QUOTE',
        link: `/quotes/${req.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  },
  acceptQuote: (quoteId: string): Booking | null => {
    const quotes = Storage.getQuotes();
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return null;

    quote.status = 'ACCEPTED';
    safeSetItem(STORAGE_KEYS.QUOTES, quotes);

    const request = Storage.getRequestById(quote.requestId);
    if (request) {
      request.status = 'ACCEPTED';
      const requests = Storage.getRequests();
      const rIdx = requests.findIndex((r) => r.id === request.id);
      if (rIdx >= 0) requests[rIdx] = request;
      safeSetItem(STORAGE_KEYS.REQUESTS, requests);
    }

    // Auto generate a booking
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingNumber: `HB-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: request?.customerId || 'user-c1',
      customerName: request?.customerName || 'Fatima Malik',
      customerPhone: '+92 300 1234567',
      customerEmail: 'customer@example.com',
      vendorId: quote.vendorId,
      vendorName: quote.vendorName,
      vendorSlug: quote.vendorSlug,
      serviceId: `quote-${quote.id}`,
      serviceTitle: request?.serviceNeeded || 'Customized Service Quote',
      serviceImage: quote.vendorAvatar,
      date: request?.preferredDate || new Date().toISOString().split('T')[0],
      timeSlot: 'Flexible / As Agreed',
      notes: `Accepted Quote #${quote.quoteNumber}. ${quote.message}`,
      deliveryAddress: request ? `${request.area}, ${request.city}` : 'To be confirmed',
      deliveryType: request?.deliveryMethod || 'DELIVERY',
      selectedAddons: [],
      subtotal: quote.price,
      addonsTotal: 0,
      platformFee: quote.serviceFee || 200,
      discount: 0,
      total: quote.totalPrice,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH_ON_DELIVERY',
      createdAt: new Date().toISOString(),
    };

    Storage.createBooking(newBooking);

    // Notify vendor
    const vendor = Storage.getVendorById(quote.vendorId);
    if (vendor) {
      Storage.createNotification({
        id: `notif-${Date.now()}`,
        userId: vendor.userId,
        title: 'Quote Accepted! 🎉',
        message: `${request?.customerName || 'Customer'} accepted your quote #${quote.quoteNumber}. Order created!`,
        type: 'QUOTE_ACCEPTED',
        link: '/seller/dashboard/bookings',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return newBooking;
  },

  // Conversations & Messages
  getConversations: (): Conversation[] => safeGetItem(STORAGE_KEYS.CONVERSATIONS, SEED_CONVERSATIONS),
  getMessages: (conversationId?: string): Message[] => {
    const all = safeGetItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    if (!conversationId) return all;
    return all.filter((m) => m.conversationId === conversationId);
  },
  sendMessage: (msg: Omit<Message, 'id' | 'createdAt' | 'read'>): Message => {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const messages = safeGetItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    messages.push(newMsg);
    safeSetItem(STORAGE_KEYS.MESSAGES, messages);

    // Update conversation last message locally
    const conversations = Storage.getConversations();
    const conv = conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessage = msg.text;
      conv.lastMessageAt = newMsg.createdAt;
      safeSetItem(STORAGE_KEYS.CONVERSATIONS, conversations);
    }

    // Sync to Supabase in background
    SupabaseDb.sendMessage(msg.conversationId, msg.senderId, msg.senderName, msg.senderRole, msg.text)
      .catch((e) => console.warn('Supabase message sync error:', e));

    return newMsg;
  },
  // Called by Supabase Realtime handler to append incoming messages from other users
  appendRealtimeMessage: (msg: Message): void => {
    const messages = safeGetItem<Message[]>(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
    // Deduplicate — don't add if already present
    if (messages.some((m) => m.id === msg.id)) return;
    messages.push(msg);
    safeSetItem(STORAGE_KEYS.MESSAGES, messages);

    // Update conversation last message
    const conversations = Storage.getConversations();
    const conv = conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessage = msg.text;
      conv.lastMessageAt = msg.createdAt || msg.timestamp || new Date().toISOString();
      safeSetItem(STORAGE_KEYS.CONVERSATIONS, conversations);
    }

    // Trigger reactive UI update
    window.dispatchEvent(new CustomEvent('hb_storage_update'));
  },
  getOrCreateConversation: (
    customerId: string,
    vendorId: string,
    context?: { type: 'BOOKING' | 'REQUEST' | 'GENERAL'; id: string; title: string }
  ): Conversation => {
    const conversations = Storage.getConversations();
    let conv = conversations.find((c) => c.customerId === customerId && c.vendorId === vendorId);
    if (!conv) {
      const customer = Storage.getUserById(customerId);
      const vendor = Storage.getVendorById(vendorId);
      conv = {
        id: `conv-${Date.now()}`,
        participants: [
          { id: customerId, name: customer?.name || 'Customer', avatar: customer?.avatar, role: 'CUSTOMER' },
          { id: vendor?.userId || 'vendor', name: vendor?.businessName || 'Seller', avatar: vendor?.avatar, role: 'SELLER' },
        ],
        vendorId,
        vendorName: vendor?.businessName,
        vendorAvatar: vendor?.avatar,
        customerId,
        customerName: customer?.name,
        customerAvatar: customer?.avatar,
        contextType: context?.type || 'GENERAL',
        contextId: context?.id,
        contextTitle: context?.title,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date().toISOString(),
        unreadCountCustomer: 0,
        unreadCountVendor: 0,
      };
      conversations.unshift(conv);
      safeSetItem(STORAGE_KEYS.CONVERSATIONS, conversations);
    }
    return conv;
  },

  // Reviews
  getReviews: (vendorId?: string): Review[] => {
    const all = safeGetItem<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
    if (!vendorId) return all;
    return all.filter((r) => r.vendorId === vendorId && r.status === 'PUBLISHED');
  },
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'status'>): Review => {
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'PUBLISHED',
    };
    const reviews = safeGetItem<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
    reviews.unshift(newRev);
    safeSetItem(STORAGE_KEYS.REVIEWS, reviews);

    // Sync to Supabase in background
    SupabaseDb.createReview(newRev).catch((e) => console.warn('Supabase review sync error:', e));

    // Update vendor aggregate rating
    const vendor = Storage.getVendorById(review.vendorId);
    if (vendor) {
      const vendorReviews = reviews.filter((r) => r.vendorId === review.vendorId);
      const avg = vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length;
      vendor.rating = parseFloat(avg.toFixed(2));
      vendor.reviewCount = vendorReviews.length;
      Storage.saveVendor(vendor);

      // Notify vendor
      Storage.createNotification({
        id: `notif-${Date.now()}`,
        userId: vendor.userId,
        title: 'New Review Received ⭐',
        message: `${review.customerName} left a ${review.rating}-star review for your business!`,
        type: 'REVIEW_REMINDER',
        link: '/seller/dashboard/reviews',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    return newRev;
  },
  replyToReview: (reviewId: string, replyText: string): void => {
    const reviews = safeGetItem<Review[]>(STORAGE_KEYS.REVIEWS, SEED_REVIEWS);
    const rev = reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.sellerReply = {
        text: replyText,
        repliedAt: new Date().toISOString(),
      };
      safeSetItem(STORAGE_KEYS.REVIEWS, reviews);
    }
  },

  // Favorites
  getFavorites: (customerId: string): Favorite[] => {
    const all = safeGetItem<Favorite[]>(STORAGE_KEYS.FAVORITES, []);
    return all.filter((f) => f.customerId === customerId);
  },
  isFavorite: (customerId: string, vendorId: string): boolean => {
    return Storage.getFavorites(customerId).some((f) => f.vendorId === vendorId);
  },
  toggleFavorite: (customerId: string, vendorId: string): boolean => {
    const all = safeGetItem<Favorite[]>(STORAGE_KEYS.FAVORITES, []);
    const idx = all.findIndex((f) => f.customerId === customerId && f.vendorId === vendorId);
    let isNowFav = false;
    if (idx >= 0) {
      all.splice(idx, 1);
    } else {
      all.push({
        id: `fav-${Date.now()}`,
        customerId,
        vendorId,
        createdAt: new Date().toISOString(),
      });
      isNowFav = true;
    }
    safeSetItem(STORAGE_KEYS.FAVORITES, all);
    return isNowFav;
  },

  // Notifications
  getNotifications: (userId: string): Notification[] => {
    const all = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    return all.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  createNotification: (notif: Notification): void => {
    const all = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    all.unshift(notif);
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, all);
  },
  markNotificationAsRead: (id: string): void => {
    const all = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const n = all.find((item) => item.id === id);
    if (n) {
      n.read = true;
      safeSetItem(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  },
  markAllNotificationsAsRead: (userId: string): void => {
    const all = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    all.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  // Blog Posts
  getBlogPosts: (): BlogPost[] => [
    {
      id: 'blog-1',
      slug: 'top-10-home-bakers-lahore-2025',
      title: 'Top 10 Home Bakers in Lahore Crafting Unreal Custom Cakes',
      excerpt: 'From vintage Lambeth piped cakes in Gulberg to Belgian chocolate fudge in DHA, here are Lahore’s most celebrated home confectioners.',
      content: `Home baking in Pakistan is experiencing an unprecedented golden age. In neighborhoods across Lahore—from Phase 5 DHA to Model Town and Johar Town—talented home chefs are creating artisan confections that rival and often exceed commercial bakeries.

### Why Home Baking Wins
Unlike factory-line bakeries, home bakers prepare small, made-to-order batches using 100% pure butter, imported Dutch cocoa, and real vanilla bean pods. Every cake is a personalized work of art.

### Trending Styles in Lahore
1. **Korean Vintage Bento Cakes**: Mini 4-inch lunchbox cakes with delicate pastel piping.
2. **Lambeth Victorian Ruffle Cakes**: Multi-tiered royal icing piped confections for bridal showers.
3. **Lotus Biscoff & Salted Caramel Pull-Me-Up Cakes**: Interactive dessert experiences for birthday celebrations.

Support local talent on HomeBiz Pakistan by booking fresh cakes with 24-48 hours advance notice directly from verified home kitchens.`,
      author: 'Ayesha Siddiqui',
      authorRole: 'Culinary Editor',
      coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
      category: 'Home Food & Baking',
      publishedAt: 'February 24, 2025',
      readTime: '4 min read',
    },
    {
      id: 'blog-2',
      slug: 'how-to-hire-home-tailor-wedding-season',
      title: 'How to Get Your Dream Eid & Wedding Joras Stitched by Home Tailors',
      excerpt: 'Avoid chaotic market tailors this season. Learn how verified home tailors and master pattern cutters deliver perfect bespoke fits with doorstep trial.',
      content: `The wedding season in Pakistan is notoriously stressful when it comes to getting raw unstitched fabrics transformed into designer silhouettes.

### The Home Tailor Advantage
Home-based master tailors (ustads and female pattern cutters) take on a limited number of clients per week. This guarantees:
- Accurate necklines and armhole fitting.
- Precise hand embroidery and patti placement.
- On-time delivery before your mehndi or dholki event.

### Tips for Clear Custom Orders
- Provide exact measurements or a favorite master sample shirt.
- Upload high-resolution Pinterest reference photos when posting your request on HomeBiz.
- Specify if you need piping, French seams, or custom organza lace finishing.`,
      author: 'Zainab Qureshi',
      authorRole: 'Fashion & Textiles Contributor',
      coverImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
      category: 'Tailoring & Alterations',
      publishedAt: 'February 18, 2025',
      readTime: '5 min read',
    },
    {
      id: 'blog-3',
      slug: 'empowering-women-home-entrepreneurs-pakistan',
      title: 'How HomeBiz is Powering Financial Independence for 10,000+ Pakistani Women',
      excerpt: 'Discover how home chefs, painters, tutors, and crafters in Karachi, Islamabad, and Lahore are turning domestic talents into thriving micro-enterprises.',
      content: `Over 70% of home-based businesses in Pakistan are founded and operated by women. However, traditional barriers—such as digital marketing costs, logistics, and trust gaps—frequently hindered their growth.

### Zero Upfront Risk
With HomeBiz Pakistan's verified creator network, women can list their specialties, set notice periods, receive direct customer inquiries, and collect guaranteed payments without needing a commercial storefront.

From single mothers running catering setups to university students selling handmade soy candles, micro-entrepreneurship is driving household economic growth across the nation.`,
      author: 'Hamza Tariq',
      authorRole: 'Ecosystem & Impact Lead',
      coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      category: 'Community & Stories',
      publishedAt: 'January 30, 2025',
      readTime: '6 min read',
    },
  ],
  getBlogPostBySlug: (slug: string): BlogPost | undefined => {
    return Storage.getBlogPosts().find((p) => p.slug === slug);
  },

  // Commission & Admin Stats
  getCommissionSettings: (): CommissionSettings => safeGetItem(STORAGE_KEYS.COMMISSIONS, SEED_COMMISSION_SETTINGS),
  saveCommissionSettings: (settings: CommissionSettings): void => safeSetItem(STORAGE_KEYS.COMMISSIONS, settings),

  // Pricing Plans
  getPricingPlans: (): PricingPlan[] => {
    const plans = safeGetItem<PricingPlan[]>(STORAGE_KEYS.PRICING_PLANS, null);
    if (plans) return plans;

    // Initialize with default plans if none exist
    const defaultPlans: PricingPlan[] = [
      {
        id: 'plan-free',
        name: 'Free Plan',
        description: 'Best for new businesses',
        slug: 'free',
        priceMonthly: 0,
        priceYearly: 0,
        icon: '🟢',
        cta: 'Start Free',
        highlighted: false,
        active: true,
        features: [
          'Basic Business Profile',
          'Business Description',
          'Contact Information',
          'WhatsApp Button',
          'Google Maps Location',
          'Opening Hours',
          'Up to 10 Gallery Images',
          'List Services',
          'Receive Booking Requests',
          'Receive Customer Requests',
          'Basic Search Visibility',
          'Basic Dashboard',
          'Basic Analytics',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'plan-pro',
        name: 'Pro Plan',
        description: 'Best for growing businesses',
        slug: 'pro',
        priceMonthly: 2999,
        priceYearly: 29990,
        icon: '⚡',
        cta: 'Upgrade to Pro',
        highlighted: true,
        badge: 'Most Popular',
        active: true,
        features: [
          'Everything in Free, plus:',
          'Priority Search Ranking',
          'Unlimited Gallery Images',
          'Unlimited Services',
          'Customer Reviews Display',
          'Advanced Booking Management',
          'Quote Management',
          'Advanced Analytics',
          'Social Media Links',
          'Featured Profile Badge',
          'Business Performance Insights',
          'Promotional Campaign Access',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'plan-featured',
        name: 'Featured Plan',
        description: 'Maximum Visibility & Growth',
        slug: 'featured',
        priceMonthly: 5999,
        priceYearly: 59990,
        icon: '👑',
        cta: 'Become Featured',
        highlighted: false,
        active: true,
        features: [
          'Everything in Pro, plus:',
          'Homepage Featured Listing',
          'Top Search Results Placement',
          'Category Priority Placement',
          'Premium Featured Badge',
          'Higher Search Visibility',
          'Seasonal Promotions',
          'Homepage Banner Placement',
          'Priority Customer Leads',
          'Premium Analytics Dashboard',
          'Priority Support (24/7)',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    safeSetItem(STORAGE_KEYS.PRICING_PLANS, defaultPlans);
    return defaultPlans;
  },

  getPricingPlanBySlug: (slug: string): PricingPlan | undefined =>
    Storage.getPricingPlans().find((p) => p.slug === slug),

  getPricingPlanById: (id: string): PricingPlan | undefined =>
    Storage.getPricingPlans().find((p) => p.id === id),

  updatePricingPlan: (id: string, updates: Partial<PricingPlan>): void => {
    const plans = Storage.getPricingPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx >= 0) {
      plans[idx] = { ...plans[idx], ...updates, updatedAt: new Date().toISOString() };
      safeSetItem(STORAGE_KEYS.PRICING_PLANS, plans);
    }
  },

  // Seller Subscriptions
  getSubscriptions: (): SellerSubscription[] => safeGetItem(STORAGE_KEYS.SUBSCRIPTIONS, []),

  getSubscriptionById: (id: string): SellerSubscription | undefined =>
    Storage.getSubscriptions().find((s) => s.id === id),

  getSubscriptionByVendorId: (vendorId: string): SellerSubscription | undefined =>
    Storage.getSubscriptions().find((s) => s.vendorId === vendorId),

  createSubscription: (subscription: SellerSubscription): void => {
    const subs = Storage.getSubscriptions();
    subs.push(subscription);
    safeSetItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);

    // Update vendor with current plan
    const vendor = Storage.getVendorById(subscription.vendorId);
    if (vendor) {
      vendor.currentPlan = subscription.plan;
      vendor.subscriptionId = subscription.id;
      Storage.saveVendor(vendor);
    }
  },

  updateSubscription: (id: string, updates: Partial<SellerSubscription>): void => {
    const subs = Storage.getSubscriptions();
    const idx = subs.findIndex((s) => s.id === id);
    if (idx >= 0) {
      subs[idx] = { ...subs[idx], ...updates, updatedAt: new Date().toISOString() };
      safeSetItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    }
  },

  upgradeVendorPlan: (
    vendorId: string,
    newPlan: SubscriptionPlan,
    options: UpgradeVendorPlanOptions = {}
  ): SellerSubscription | null => {
    const existingSub = Storage.getSubscriptionByVendorId(vendorId);
    const newPlanData = Storage.getPricingPlanBySlug(newPlan);

    if (!newPlanData) return null;

    const now = new Date();
    const billingPeriod = options.billingPeriod || 'monthly';
    const renewalDate = new Date(now);
    renewalDate.setMonth(renewalDate.getMonth() + (billingPeriod === 'yearly' ? 12 : 1));
    const priceAtPurchase =
      options.priceAtPurchase ??
      (billingPeriod === 'yearly' ? newPlanData.priceYearly : newPlanData.priceMonthly);
    const paymentStatus = options.paymentStatus || 'PAID';
    const paymentMethod = options.paymentMethod || (priceAtPurchase === 0 ? 'MANUAL' : 'CARD');

    let savedSubscription: SellerSubscription;

    if (existingSub) {
      savedSubscription = {
        ...existingSub,
        plan: newPlan,
        planId: newPlanData.id,
        status: 'ACTIVE',
        billingPeriod,
        priceAtPurchase,
        renewalDate: renewalDate.toISOString(),
        paymentMethod,
        paymentStatus,
        transactionId: options.transactionId || existingSub.transactionId,
        providerReference: options.providerReference || existingSub.providerReference,
        lastPaymentAt: paymentStatus === 'PAID' ? now.toISOString() : existingSub.lastPaymentAt,
        updatedAt: now.toISOString(),
      };
      Storage.updateSubscription(existingSub.id, savedSubscription);
    } else {
      savedSubscription = {
        id: `sub-${Date.now()}`,
        vendorId,
        planId: newPlanData.id,
        plan: newPlan,
        status: 'ACTIVE',
        billingPeriod,
        priceAtPurchase,
        startDate: now.toISOString(),
        renewalDate: renewalDate.toISOString(),
        paymentMethod,
        paymentStatus,
        transactionId: options.transactionId,
        providerReference: options.providerReference,
        lastPaymentAt: paymentStatus === 'PAID' ? now.toISOString() : undefined,
        autoRenew: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      Storage.createSubscription(savedSubscription);
    }

    const vendor = Storage.getVendorById(vendorId);
    if (vendor) {
      vendor.currentPlan = newPlan;
      vendor.subscriptionId = savedSubscription.id;
      Storage.saveVendor(vendor);
      Storage.createNotification({
        id: `notif-${Date.now()}-${savedSubscription.id}`,
        userId: vendor.userId,
        title: 'Subscription Updated',
        message: `${newPlanData.name} is now active. Payment status: ${paymentStatus}.`,
        type: 'SYSTEM_ANNOUNCEMENT',
        link: '/seller/dashboard/plan',
        read: false,
        createdAt: now.toISOString(),
      });
    }

    return savedSubscription;
  },

  resetToDemoDefaults: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    initStorage();
    window.location.reload();
  },
};

// React hook to subscribe to real-time storage updates
export function useStorageSubscription() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initStorage();
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener('hb_storage_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('hb_storage_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);
}
