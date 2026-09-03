import { supabase, isSupabaseConfigured } from './supabase';
import {
  Category,
  City,
  VendorProfile,
  Booking,
  CustomerRequest,
  Quote,
  Review,
  Message,
  Conversation,
  PricingPlan,
  SellerSubscription,
} from '../types';

export const SupabaseDb = {
  // 1. Categories
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description || '',
        iconName: row.icon_name || 'Cake',
        image: row.image || '',
        vendorCount: row.vendor_count || 0,
        subcategories: row.subcategories || [],
        featured: row.featured,
      }));
    } catch (err) {
      console.warn('Supabase getCategories error:', err);
      return [];
    }
  },

  // 2. Cities
  async getCities(): Promise<City[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        province: row.province,
        popularAreas: row.popular_areas || [],
        vendorCount: row.vendor_count || 0,
        featured: row.featured,
      }));
    } catch (err) {
      console.warn('Supabase getCities error:', err);
      return [];
    }
  },

  // 3. Pricing Plans
  async getPricingPlans(): Promise<PricingPlan[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly');
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        priceMonthly: Number(row.price_monthly),
        priceYearly: Number(row.price_yearly),
        features: row.features || [],
        icon: row.icon || 'Check',
        cta: row.cta || 'Select Plan',
        highlighted: row.highlighted,
        badge: row.badge,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.created_at,
      }));
    } catch (err) {
      console.warn('Supabase getPricingPlans error:', err);
      return [];
    }
  },

  // 4. Vendors
  async getVendors(): Promise<VendorProfile[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, services(*)');
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return data.map((v) => ({
        id: v.id,
        userId: v.user_id,
        businessName: v.business_name,
        slug: v.slug,
        tagline: v.tagline || '',
        description: v.description || '',
        category: v.category,
        subcategories: v.subcategories || [],
        city: v.city,
        locality: v.locality,
        exactAddress: v.exact_address,
        showExactAddress: v.show_exact_address,
        coverImage: v.cover_image,
        avatar: v.avatar,
        gallery: v.gallery || [],
        startingPrice: Number(v.starting_price),
        rating: Number(v.rating),
        reviewCount: v.review_count,
        responseTime: v.response_time,
        experienceYears: v.experience_years,
        status: v.status,
        verificationStatus: v.verification_status,
        isFeatured: v.is_featured,
        serviceAreas: v.service_areas || [],
        specialties: v.specialties || [],
        availabilityNotice: v.availability_notice || '',
        coordinates: v.coordinates || { lat: 31.5204, lng: 74.3587 },
        currentPlan: v.current_plan,
        createdAt: v.created_at,
        services: (v.services || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          price: Number(s.price),
          duration: s.duration,
          noticePeriod: s.notice_period || '',
          image: s.image,
          category: s.category,
          addons: s.addons || [],
          isPopular: s.is_popular,
        })),
      }));
    } catch (err) {
      console.warn('Supabase getVendors error:', err);
      return [];
    }
  },

  // 5. Bookings
  async createBooking(booking: Booking): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('bookings').insert({
        booking_number: booking.bookingNumber,
        customer_id: booking.customerId.startsWith('user-') ? null : booking.customerId,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail,
        vendor_id: booking.vendorId.startsWith('vendor-') ? null : booking.vendorId,
        vendor_name: booking.vendorName,
        vendor_slug: booking.vendorSlug,
        service_title: booking.serviceTitle,
        service_image: booking.serviceImage,
        date: booking.date,
        time_slot: booking.timeSlot,
        notes: booking.notes,
        delivery_address: booking.deliveryAddress,
        delivery_type: booking.deliveryType,
        selected_addons: booking.selectedAddons,
        subtotal: booking.subtotal,
        addons_total: booking.addonsTotal,
        platform_fee: booking.platformFee,
        discount: booking.discount,
        total: booking.total,
        status: booking.status,
        payment_status: booking.paymentStatus,
        payment_method: booking.paymentMethod,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase createBooking error:', err);
      return false;
    }
  },

  // 6. Messages & Realtime
  async sendMessage(conversationId: string, senderId: string, senderName: string, senderRole: string, text: string): Promise<Message | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId.startsWith('user-') ? null : senderId,
          sender_name: senderName,
          sender_role: senderRole,
          text,
          read: false,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id || senderId,
        senderName: data.sender_name,
        senderRole: data.sender_role,
        text: data.text,
        attachmentUrl: data.attachment_url,
        createdAt: data.created_at,
        read: data.read,
      };
    } catch (err) {
      console.warn('Supabase sendMessage error:', err);
      return null;
    }
  },

  // 7. Customer Requests
  async createCustomerRequest(req: CustomerRequest): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('customer_requests').insert({
        request_number: req.requestNumber,
        customer_id: req.customerId.startsWith('user-') ? null : req.customerId,
        customer_name: req.customerName,
        customer_avatar: req.customerAvatar,
        category: req.category,
        service_needed: req.serviceNeeded,
        city: req.city,
        area: req.area,
        preferred_date: req.preferredDate,
        budget: req.budget,
        guest_count_or_quantity: req.guestCountOrQuantity,
        description: req.description,
        delivery_method: req.deliveryMethod,
        status: req.status,
        photos: req.photos,
        quote_count: req.quoteCount || 0,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase createCustomerRequest error:', err);
      return false;
    }
  },

  // 8. Quotes
  async createQuote(quote: Quote): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('quotes').insert({
        quote_number: quote.quoteNumber,
        request_id: quote.requestId.startsWith('req-') ? null : quote.requestId,
        vendor_id: quote.vendorId.startsWith('vendor-') ? null : quote.vendorId,
        vendor_name: quote.vendorName,
        vendor_slug: quote.vendorSlug,
        vendor_avatar: quote.vendorAvatar,
        vendor_rating: quote.vendorRating,
        vendor_review_count: quote.vendorReviewCount,
        price: quote.price,
        service_fee: quote.serviceFee,
        delivery_fee: quote.deliveryFee,
        total_price: quote.totalPrice,
        items_breakdown: quote.itemsBreakdown,
        estimated_completion: quote.estimatedCompletion,
        message: quote.message,
        valid_until: quote.validUntil,
        status: quote.status,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase createQuote error:', err);
      return false;
    }
  },

  // 9. Reviews
  async createReview(review: Review): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('reviews').insert({
        vendor_id: review.vendorId.startsWith('vendor-') ? null : review.vendorId,
        booking_id: review.bookingId?.startsWith('bk-') ? null : review.bookingId,
        customer_id: review.customerId.startsWith('user-') ? null : review.customerId,
        customer_name: review.customerName,
        customer_avatar: review.customerAvatar,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase createReview error:', err);
      return false;
    }
  },
};

