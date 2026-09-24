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
  ServiceItem,
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

  // 3b. Update Pricing Plan (Admin only)
  async updatePricingPlan(
    idOrSlug: string,
    updates: {
      priceMonthly?: number;
      priceYearly?: number;
      active?: boolean;
      name?: string;
      description?: string;
    },
    planSlug?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }
    try {
      const payload: Record<string, any> = {};
      if (updates.priceMonthly !== undefined) payload.price_monthly = Number(updates.priceMonthly);
      if (updates.priceYearly !== undefined) payload.price_yearly = Number(updates.priceYearly);
      if (updates.active !== undefined) payload.active = Boolean(updates.active);
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      if (isUuid) {
        const { error: uuidErr } = await supabase
          .from('pricing_plans')
          .update(payload)
          .eq('id', idOrSlug);
        if (!uuidErr) return { success: true };
      }

      // Match by slug (e.g. 'pro', 'featured', 'free')
      const targetSlug = (planSlug || idOrSlug).replace(/^plan-/, '');
      const { error: slugErr } = await supabase
        .from('pricing_plans')
        .update(payload)
        .eq('slug', targetSlug);

      if (slugErr) {
        console.error('Supabase updatePricingPlan error:', slugErr);
        return { success: false, error: slugErr.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase updatePricingPlan exception:', err);
      return { success: false, error: err.message || 'Unknown error' };
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

  async upsertVendor(vendor: VendorProfile): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const payload: any = {
        business_name: vendor.businessName,
        slug: vendor.slug,
        tagline: vendor.tagline || '',
        description: vendor.description || '',
        category: vendor.category,
        subcategories: vendor.subcategories || [],
        city: vendor.city,
        locality: vendor.locality,
        exact_address: vendor.exactAddress,
        show_exact_address: vendor.showExactAddress,
        cover_image: vendor.coverImage,
        avatar: vendor.avatar,
        gallery: vendor.gallery || [],
        starting_price: vendor.startingPrice,
        rating: vendor.rating || 5.0,
        review_count: vendor.reviewCount || 0,
        response_time: vendor.responseTime || '< 30 mins',
        experience_years: vendor.experienceYears || 1,
        status: vendor.status || 'PENDING_APPROVAL',
        verification_status: vendor.verificationStatus || 'PENDING',
        is_featured: vendor.isFeatured || false,
        service_areas: vendor.serviceAreas || [],
        specialties: vendor.specialties || [],
        availability_notice: vendor.availabilityNotice || '',
        coordinates: vendor.coordinates || { lat: 31.5204, lng: 74.3587 },
        current_plan: vendor.currentPlan || 'free',
      };

      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      if (isUuid(vendor.userId)) {
        payload.user_id = vendor.userId;
      }
      if (isUuid(vendor.id)) {
        payload.id = vendor.id;
      }

      const { data, error } = await supabase
        .from('vendors')
        .upsert(payload, { onConflict: isUuid(vendor.id) ? 'id' : 'slug' })
        .select('id')
        .maybeSingle();

      if (error) {
        console.warn('Supabase upsertVendor warning:', error.message);
        return null;
      }

      const realVendorId = data?.id || (isUuid(vendor.id) ? vendor.id : null);

      if (realVendorId && vendor.services && vendor.services.length > 0) {
        for (const s of vendor.services) {
          await SupabaseDb.addVendorService(realVendorId, s);
        }
      }

      return realVendorId;
    } catch (err) {
      console.warn('Supabase upsertVendor exception:', err);
      return null;
    }
  },

  async addVendorService(vendorIdOrSlug: string, service: ServiceItem): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let resolvedVendorId = isUuid(vendorIdOrSlug) ? vendorIdOrSlug : null;
      if (!resolvedVendorId) {
        const { data: v } = await supabase
          .from('vendors')
          .select('id')
          .eq('slug', vendorIdOrSlug)
          .maybeSingle();
        if (v) resolvedVendorId = v.id;
      }

      if (!resolvedVendorId) {
        console.warn('Could not resolve vendor ID for service insertion:', vendorIdOrSlug);
        return false;
      }

      const payload: any = {
        vendor_id: resolvedVendorId,
        title: service.title,
        description: service.description || '',
        price: service.price,
        duration: service.duration || '24 hours',
        notice_period: service.noticePeriod || '',
        image: service.image || '',
        category: service.category || '',
        addons: service.addons || [],
        is_popular: service.isPopular || false,
      };

      if (isUuid(service.id)) {
        payload.id = service.id;
      }

      const { error } = await supabase
        .from('services')
        .insert(payload);

      if (error) {
        console.warn('Supabase addVendorService warning:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase addVendorService exception:', err);
      return false;
    }
  },

  async deleteVendorService(serviceId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    if (!isUuid(serviceId)) return false;
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteVendorService error:', err);
      return false;
    }
  },

  async updateVendorVerification(vendorIdOrSlug: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'UNVERIFIED'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      const dbStatus = status === 'VERIFIED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING_APPROVAL';
      
      const updatePayload = {
        verification_status: status,
        status: dbStatus,
      };

      if (isUuid(vendorIdOrSlug)) {
        await supabase.from('vendors').update(updatePayload).eq('id', vendorIdOrSlug);
      } else {
        await supabase.from('vendors').update(updatePayload).eq('slug', vendorIdOrSlug);
      }
      return true;
    } catch (err) {
      console.warn('Supabase updateVendorVerification error:', err);
      return false;
    }
  },

  // 5. Bookings
  async getBookings(filter?: { vendorSlug?: string; customerEmail?: string; customerId?: string; vendorId?: string }): Promise<Booking[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (filter?.vendorSlug) {
        query = query.eq('vendor_slug', filter.vendorSlug);
      }
      if (filter?.customerEmail) {
        query = query.eq('customer_email', filter.customerEmail);
      }
      if (filter?.customerId) {
        query = query.eq('customer_id', filter.customerId);
      }
      if (filter?.vendorId) {
        query = query.eq('vendor_id', filter.vendorId);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];
      return data.map((b) => ({
        id: b.id,
        bookingNumber: b.booking_number,
        customerId: b.customer_id || 'guest',
        customerName: b.customer_name,
        customerPhone: b.customer_phone || '',
        customerEmail: b.customer_email || '',
        vendorId: b.vendor_id || '',
        vendorName: b.vendor_name,
        vendorSlug: b.vendor_slug || '',
        serviceId: b.service_id || 'srv-default',
        serviceTitle: b.service_title,
        serviceImage: b.service_image,
        date: b.date,
        timeSlot: b.time_slot,
        notes: b.notes || '',
        deliveryAddress: b.delivery_address || '',
        deliveryType: b.delivery_type || 'DELIVERY',
        selectedAddons: b.selected_addons || [],
        subtotal: Number(b.subtotal),
        addonsTotal: Number(b.addons_total || 0),
        platformFee: Number(b.platform_fee || 0),
        discount: Number(b.discount || 0),
        total: Number(b.total),
        status: b.status,
        paymentStatus: b.payment_status,
        paymentMethod: b.payment_method,
        createdAt: b.created_at,
      }));
    } catch (err) {
      console.warn('Supabase getBookings error:', err);
      return [];
    }
  },

  async createBooking(booking: Booking): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let resolvedVendorId = isUuid(booking.vendorId) ? booking.vendorId : null;
      if (!resolvedVendorId && booking.vendorSlug) {
        const { data: v } = await supabase.from('vendors').select('id').eq('slug', booking.vendorSlug).maybeSingle();
        if (v) resolvedVendorId = v.id;
      }

      const { error } = await supabase.from('bookings').insert({
        booking_number: booking.bookingNumber,
        customer_id: isUuid(booking.customerId) ? booking.customerId : null,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail,
        vendor_id: resolvedVendorId,
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

  async updateBookingStatus(bookingNumber: string, status: string, paymentStatus?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const updateData: any = { status };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('booking_number', bookingNumber);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase updateBookingStatus error:', err);
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

  async getReviews(vendorId?: string): Promise<Review[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase.from('reviews').select('*').eq('status', 'PUBLISHED').order('created_at', { ascending: false });
      if (vendorId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId);
        if (isUuid) {
          query = query.eq('vendor_id', vendorId);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];
      return data.map((rev) => ({
        id: rev.id,
        vendorId: rev.vendor_id || '',
        bookingId: rev.booking_id,
        customerId: rev.customer_id || '',
        customerName: rev.customer_name,
        customerAvatar: rev.customer_avatar,
        rating: rev.rating,
        comment: rev.comment,
        sellerReply: rev.seller_reply,
        status: rev.status,
        createdAt: rev.created_at,
      }));
    } catch (err) {
      console.warn('Supabase getReviews error:', err);
      return [];
    }
  },

  // 10. Subscriptions
  async getSubscriptions(): Promise<SellerSubscription[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('seller_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];
      return data.map((s) => ({
        id: s.id,
        vendorId: s.vendor_id,
        planId: s.plan_id || '',
        plan: s.plan,
        status: s.status,
        billingPeriod: s.billing_period || 'monthly',
        priceAtPurchase: Number(s.price_at_purchase || 0),
        startDate: s.start_date || s.created_at,
        renewalDate: s.renewal_date || '',
        paymentMethod: s.payment_method || 'CARD',
        paymentStatus: s.payment_status || 'PENDING',
        transactionId: s.transaction_id,
        providerReference: s.provider_reference,
        lastPaymentAt: s.last_payment_at,
        autoRenew: Boolean(s.auto_renew),
        createdAt: s.created_at,
        updatedAt: s.created_at,
      }));
    } catch (err) {
      console.warn('Supabase getSubscriptions error:', err);
      return [];
    }
  },

  async upsertSubscription(sub: SellerSubscription): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      let resolvedVendorId = isUuid(sub.vendorId) ? sub.vendorId : null;
      if (!resolvedVendorId) {
        const { data: v } = await supabase.from('vendors').select('id').eq('slug', sub.vendorId).maybeSingle();
        if (v) resolvedVendorId = v.id;
      }
      if (!resolvedVendorId) return false;

      const payload: any = {
        vendor_id: resolvedVendorId,
        plan: sub.plan,
        status: sub.status,
        billing_period: sub.billingPeriod,
        price_at_purchase: sub.priceAtPurchase,
        payment_method: sub.paymentMethod,
        payment_status: sub.paymentStatus,
        auto_renew: sub.autoRenew ?? true,
      };

      if (isUuid(sub.id)) {
        payload.id = sub.id;
      }
      if (isUuid(sub.planId)) {
        payload.plan_id = sub.planId;
      }
      if (sub.renewalDate) {
        payload.renewal_date = sub.renewalDate;
      }

      const { error } = await supabase
        .from('seller_subscriptions')
        .upsert(payload, { onConflict: isUuid(sub.id) ? 'id' : undefined });

      if (error) {
        console.warn('Supabase upsertSubscription error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase upsertSubscription exception:', err);
      return false;
    }
  },

  async updateSubscriptionStatus(id: string, status: string, paymentStatus: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
      if (!isUuid(id)) return false;

      const { error } = await supabase
        .from('seller_subscriptions')
        .update({
          status,
          payment_status: paymentStatus,
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase updateSubscriptionStatus error:', err);
      return false;
    }
  },

  // 11. Customer Requests Reader
  async getCustomerRequests(): Promise<CustomerRequest[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('customer_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];
      return data.map((r) => ({
        id: r.id,
        requestNumber: r.request_number,
        customerId: r.customer_id || 'guest',
        customerName: r.customer_name,
        customerAvatar: r.customer_avatar,
        category: r.category,
        serviceNeeded: r.service_needed,
        city: r.city,
        area: r.area,
        preferredDate: r.preferred_date,
        budget: Number(r.budget),
        guestCountOrQuantity: r.guest_count_or_quantity,
        description: r.description,
        deliveryMethod: r.delivery_method,
        status: r.status,
        photos: r.photos || [],
        quoteCount: r.quote_count || 0,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Supabase getCustomerRequests error:', err);
      return [];
    }
  },

  // 12. Quotes Reader
  async getQuotes(requestId?: string): Promise<Quote[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase.from('quotes').select('*').order('created_at', { ascending: false });
      if (requestId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);
        if (isUuid) {
          query = query.eq('request_id', requestId);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      if (!data) return [];
      return data.map((q) => ({
        id: q.id,
        quoteNumber: q.quote_number,
        requestId: q.request_id || '',
        vendorId: q.vendor_id || '',
        vendorName: q.vendor_name,
        vendorSlug: q.vendor_slug || '',
        vendorAvatar: q.vendor_avatar || '',
        vendorRating: Number(q.vendor_rating || 5.0),
        vendorReviewCount: q.vendor_review_count || 0,
        price: Number(q.price),
        serviceFee: Number(q.service_fee || 0),
        deliveryFee: Number(q.delivery_fee || 0),
        totalPrice: Number(q.total_price),
        itemsBreakdown: q.items_breakdown || [],
        estimatedCompletion: q.estimated_completion || '',
        message: q.message || '',
        validUntil: q.valid_until || '',
        status: q.status,
        createdAt: q.created_at,
      }));
    } catch (err) {
      console.warn('Supabase getQuotes error:', err);
      return [];
    }
  },
};

