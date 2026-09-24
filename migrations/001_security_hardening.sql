-- ==============================================================================
-- HomeBiz Pakistan & Australia - Production Security Hardening Migration
-- Migration: 001_security_hardening.sql
-- Description:
--   1. Implements strict Row Level Security (RLS) across all tables
--   2. Prevents privilege escalation (role=ADMIN, verification status, plans)
--   3. Secures customer requests, quotes, bookings, conversations, and reviews
--   4. Drops vulnerable RPC reset functions and locks down OTP verifications
--   5. Adds database constraints, check rules, indexes, and storage security
-- ==============================================================================

-- 1. DROP INSECURE FUNCTIONS & POLICIES
DROP FUNCTION IF EXISTS public.reset_user_password(TEXT, TEXT);

-- Drop any legacy/variant policy names
DROP POLICY IF EXISTS "Public profiles can be viewed" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public vendors read" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendors;
DROP POLICY IF EXISTS "Vendors update own profile" ON public.vendors;
DROP POLICY IF EXISTS "Public services read" ON public.services;
DROP POLICY IF EXISTS "Vendors manage services" ON public.services;
DROP POLICY IF EXISTS "Public requests read" ON public.customer_requests;
DROP POLICY IF EXISTS "Authenticated create request" ON public.customer_requests;
DROP POLICY IF EXISTS "Customers manage own request" ON public.customer_requests;
DROP POLICY IF EXISTS "Quotes viewable by request customer or seller" ON public.quotes;
DROP POLICY IF EXISTS "Vendors create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create booking" ON public.bookings;
DROP POLICY IF EXISTS "Participants can update booking" ON public.bookings;
DROP POLICY IF EXISTS "Conversation participants can view" ON public.conversations;
DROP POLICY IF EXISTS "Conversation create" ON public.conversations;
DROP POLICY IF EXISTS "Messages viewable by participants" ON public.messages;
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
DROP POLICY IF EXISTS "Public reviews read" ON public.reviews;
DROP POLICY IF EXISTS "Allow anon insert to otp_verifications" ON public.otp_verifications;
DROP POLICY IF EXISTS "Allow anon select on otp_verifications" ON public.otp_verifications;
DROP POLICY IF EXISTS "Allow anon update on otp_verifications" ON public.otp_verifications;
DROP POLICY IF EXISTS "Public pricing plans read" ON public.pricing_plans;
DROP POLICY IF EXISTS "Public categories read" ON public.categories;
DROP POLICY IF EXISTS "Public cities read" ON public.cities;

-- 2. HELPER FUNCTION: IS_ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. SECURE PROFILE TRIGGER: PREVENT SELF-ESCALATION TO ADMIN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Strict check: new signups can NEVER specify 'ADMIN' via client metadata
  IF (new.raw_user_meta_data->>'role') = 'SELLER' THEN
    assigned_role := 'SELLER';
  ELSE
    assigned_role := 'CUSTOMER';
  END IF;

  INSERT INTO public.profiles (id, name, email, role, city, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'city', 'Lahore'),
    COALESCE(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    avatar = EXCLUDED.avatar;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PROFILE ROLE PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_user_role ON public.profiles;
CREATE TRIGGER trg_protect_user_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_user_role();

-- 5. VENDOR STATUS & PLAN PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.protect_vendor_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := OLD.status;
    NEW.verification_status := OLD.verification_status;
    NEW.is_featured := OLD.is_featured;
    NEW.current_plan := OLD.current_plan;
    NEW.rating := OLD.rating;
    NEW.review_count := OLD.review_count;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_vendor_status ON public.vendors;
CREATE TRIGGER trg_protect_vendor_status
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE PROCEDURE public.protect_vendor_status();

-- 6. BOOKING FINANCIAL DATA PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.protect_booking_financials()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.subtotal := OLD.subtotal;
    NEW.total := OLD.total;
    NEW.platform_fee := OLD.platform_fee;
    NEW.discount := OLD.discount;
    NEW.customer_id := OLD.customer_id;
    NEW.vendor_id := OLD.vendor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_booking_financials ON public.bookings;
CREATE TRIGGER trg_protect_booking_financials
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.protect_booking_financials();

-- 7. SELLER SUBSCRIPTION PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.protect_seller_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.plan <> 'free' AND (TG_OP = 'INSERT' OR NEW.status = 'ACTIVE') THEN
      NEW.status := 'PENDING_VERIFICATION';
      NEW.payment_status := 'PENDING_VERIFICATION';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_seller_subscription ON public.seller_subscriptions;
CREATE TRIGGER trg_protect_seller_subscription
  BEFORE INSERT OR UPDATE ON public.seller_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.protect_seller_subscription();

-- ==============================================================================
-- 8. CHECK CONSTRAINTS & SANITIZATION
-- ==============================================================================
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS chk_service_price_positive;
ALTER TABLE public.services ADD CONSTRAINT chk_service_price_positive CHECK (price >= 0);

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS chk_booking_amounts_positive;
ALTER TABLE public.bookings ADD CONSTRAINT chk_booking_amounts_positive CHECK (
  subtotal >= 0 AND total >= 0 AND platform_fee >= 0 AND discount >= 0
);

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS chk_quote_prices_positive;
ALTER TABLE public.quotes ADD CONSTRAINT chk_quote_prices_positive CHECK (
  price >= 0 AND service_fee >= 0 AND delivery_fee >= 0 AND total_price >= 0
);

ALTER TABLE public.customer_requests DROP CONSTRAINT IF EXISTS chk_request_budget_positive;
ALTER TABLE public.customer_requests ADD CONSTRAINT chk_request_budget_positive CHECK (budget >= 0);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS chk_review_rating_range;
ALTER TABLE public.reviews ADD CONSTRAINT chk_review_rating_range CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE public.pricing_plans DROP CONSTRAINT IF EXISTS chk_plan_prices_positive;
ALTER TABLE public.pricing_plans ADD CONSTRAINT chk_plan_prices_positive CHECK (
  price_monthly >= 0 AND price_yearly >= 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booking_review
  ON public.reviews (customer_id, booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors (user_id);
CREATE INDEX IF NOT EXISTS idx_services_vendor_id ON public.services (vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id ON public.bookings (vendor_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_customer_id ON public.customer_requests (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON public.quotes (request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_id ON public.quotes (vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations (customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations (vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON public.reviews (vendor_id);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_vendor_id ON public.seller_subscriptions (vendor_id);

-- ==============================================================================
-- 9. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles read by owner or admin" ON public.profiles;
CREATE POLICY "Profiles read by owner or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles update by owner or admin" ON public.profiles;
CREATE POLICY "Profiles update by owner or admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insert by owner or admin" ON public.profiles;
CREATE POLICY "Profiles insert by owner or admin"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

-- CITIES & CATEGORIES
DROP POLICY IF EXISTS "Public read cities" ON public.cities;
CREATE POLICY "Public read cities"
ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage cities" ON public.cities;
CREATE POLICY "Admin manage cities"
ON public.cities FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
ON public.categories FOR ALL
USING (public.is_admin());

-- VENDORS
DROP POLICY IF EXISTS "Vendors viewable if approved or owner or admin" ON public.vendors;
CREATE POLICY "Vendors viewable if approved or owner or admin"
ON public.vendors FOR SELECT
USING (
  status = 'APPROVED'
  OR auth.uid() = user_id
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Vendors insert own profile" ON public.vendors;
CREATE POLICY "Vendors insert own profile"
ON public.vendors FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Vendors update own profile" ON public.vendors;
CREATE POLICY "Vendors update own profile"
ON public.vendors FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin delete vendors" ON public.vendors;
CREATE POLICY "Admin delete vendors"
ON public.vendors FOR DELETE
USING (public.is_admin());

-- SERVICES
DROP POLICY IF EXISTS "Services viewable if vendor approved or owner or admin" ON public.services;
CREATE POLICY "Services viewable if vendor approved or owner or admin"
ON public.services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.status = 'APPROVED'
  )
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Vendors insert own services" ON public.services;
CREATE POLICY "Vendors insert own services"
ON public.services FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Vendors update own services" ON public.services;
CREATE POLICY "Vendors update own services"
ON public.services FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Vendors delete own services" ON public.services;
CREATE POLICY "Vendors delete own services"
ON public.services FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- CUSTOMER REQUESTS
DROP POLICY IF EXISTS "Customer requests access policy" ON public.customer_requests;
CREATE POLICY "Customer requests access policy"
ON public.customer_requests FOR SELECT
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.user_id = auth.uid()
      AND v.status = 'APPROVED'
      AND (v.category = customer_requests.category OR lower(v.city) = lower(customer_requests.city))
  )
  OR EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.vendors v ON v.id = q.vendor_id
    WHERE q.request_id = customer_requests.id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Customers create own requests" ON public.customer_requests;
CREATE POLICY "Customers create own requests"
ON public.customer_requests FOR INSERT
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers update own open requests" ON public.customer_requests;
CREATE POLICY "Customers update own open requests"
ON public.customer_requests FOR UPDATE
USING (
  (auth.uid() = customer_id AND status = 'OPEN')
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Customers delete own open requests" ON public.customer_requests;
CREATE POLICY "Customers delete own open requests"
ON public.customer_requests FOR DELETE
USING (
  (auth.uid() = customer_id AND status IN ('OPEN', 'CANCELLED'))
  OR public.is_admin()
);

-- QUOTES
DROP POLICY IF EXISTS "Quotes private view" ON public.quotes;
CREATE POLICY "Quotes private view"
ON public.quotes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_requests cr
    WHERE cr.id = quotes.request_id AND cr.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Approved vendors create quotes" ON public.quotes;
CREATE POLICY "Approved vendors create quotes"
ON public.quotes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid() AND v.status = 'APPROVED'
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Quotes update policy" ON public.quotes;
CREATE POLICY "Quotes update policy"
ON public.quotes FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid()
  ) AND status = 'PENDING')
  OR EXISTS (
    SELECT 1 FROM public.customer_requests cr
    WHERE cr.id = quotes.request_id AND cr.customer_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin delete quotes" ON public.quotes;
CREATE POLICY "Admin delete quotes"
ON public.quotes FOR DELETE
USING (public.is_admin());

-- BOOKINGS
DROP POLICY IF EXISTS "Bookings viewable by participants or admin" ON public.bookings;
CREATE POLICY "Bookings viewable by participants or admin"
ON public.bookings FOR SELECT
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = bookings.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
CREATE POLICY "Customers create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = customer_id OR public.is_admin());

DROP POLICY IF EXISTS "Bookings update policy" ON public.bookings;
CREATE POLICY "Bookings update policy"
ON public.bookings FOR UPDATE
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = bookings.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin delete bookings" ON public.bookings;
CREATE POLICY "Admin delete bookings"
ON public.bookings FOR DELETE
USING (public.is_admin());

-- CONVERSATIONS & MESSAGES
DROP POLICY IF EXISTS "Conversations viewable by participants or admin" ON public.conversations;
CREATE POLICY "Conversations viewable by participants or admin"
ON public.conversations FOR SELECT
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = conversations.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Conversations insert by participants" ON public.conversations;
CREATE POLICY "Conversations insert by participants"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = conversations.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Conversations update by participants" ON public.conversations;
CREATE POLICY "Conversations update by participants"
ON public.conversations FOR UPDATE
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = conversations.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Messages viewable by participants or admin" ON public.messages;
CREATE POLICY "Messages viewable by participants or admin"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (
      c.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = c.vendor_id AND v.user_id = auth.uid()
      )
    )
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Messages insert by participant" ON public.messages;
CREATE POLICY "Messages insert by participant"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (
      c.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = c.vendor_id AND v.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Messages update by recipient or admin" ON public.messages;
CREATE POLICY "Messages update by recipient or admin"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (
      c.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = c.vendor_id AND v.user_id = auth.uid()
      )
    )
  )
  OR public.is_admin()
);

-- REVIEWS
DROP POLICY IF EXISTS "Reviews view policy" ON public.reviews;
CREATE POLICY "Reviews view policy"
ON public.reviews FOR SELECT
USING (
  status = 'PUBLISHED'
  OR auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = reviews.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Customers create reviews" ON public.reviews;
CREATE POLICY "Customers create reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = reviews.vendor_id AND v.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Vendors reply or admin update reviews" ON public.reviews;
CREATE POLICY "Vendors reply or admin update reviews"
ON public.reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = reviews.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin delete reviews" ON public.reviews;
CREATE POLICY "Admin delete reviews"
ON public.reviews FOR DELETE
USING (public.is_admin());

-- PRICING PLANS
DROP POLICY IF EXISTS "Public read pricing plans" ON public.pricing_plans;
CREATE POLICY "Public read pricing plans"
ON public.pricing_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage pricing plans" ON public.pricing_plans;
CREATE POLICY "Admin manage pricing plans"
ON public.pricing_plans FOR ALL
USING (public.is_admin());

-- SELLER SUBSCRIPTIONS
DROP POLICY IF EXISTS "Subscriptions viewable by vendor owner or admin" ON public.seller_subscriptions;
CREATE POLICY "Subscriptions viewable by vendor owner or admin"
ON public.seller_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = seller_subscriptions.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Vendors request subscription" ON public.seller_subscriptions;
CREATE POLICY "Vendors request subscription"
ON public.seller_subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = seller_subscriptions.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin manage subscriptions" ON public.seller_subscriptions;
CREATE POLICY "Admin manage subscriptions"
ON public.seller_subscriptions FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin delete subscriptions" ON public.seller_subscriptions;
CREATE POLICY "Admin delete subscriptions"
ON public.seller_subscriptions FOR DELETE
USING (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
CREATE POLICY "Notifications insert policy"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- FAVORITES
DROP POLICY IF EXISTS "Customers manage own favorites" ON public.favorites;
CREATE POLICY "Customers manage own favorites"
ON public.favorites FOR ALL
USING (auth.uid() = customer_id);

-- OTP VERIFICATIONS
DROP POLICY IF EXISTS "OTP admin only select" ON public.otp_verifications;
CREATE POLICY "OTP admin only select"
ON public.otp_verifications FOR SELECT
USING (public.is_admin());

-- ==============================================================================
-- 10. STORAGE BUCKET & STORAGE POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homebiz-media',
  'homebiz-media',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public read homebiz-media" ON storage.objects;
CREATE POLICY "Public read homebiz-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'homebiz-media');

DROP POLICY IF EXISTS "Authenticated users upload homebiz-media" ON storage.objects;
CREATE POLICY "Authenticated users upload homebiz-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homebiz-media'
  AND (storage.foldername(name))[1] IN ('avatars', 'covers', 'gallery', 'services', 'requests')
);

DROP POLICY IF EXISTS "Owner or admin update homebiz-media" ON storage.objects;
CREATE POLICY "Owner or admin update homebiz-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'homebiz-media' AND (auth.uid() = owner OR public.is_admin()));

DROP POLICY IF EXISTS "Owner or admin delete homebiz-media" ON storage.objects;
CREATE POLICY "Owner or admin delete homebiz-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'homebiz-media' AND (auth.uid() = owner OR public.is_admin()));
