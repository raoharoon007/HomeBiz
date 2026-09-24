-- ==============================================================================
-- HomeBiz Pakistan & Australia - Supabase Database Schema & Production Setup
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'SELLER', 'ADMIN')) DEFAULT 'CUSTOMER',
  avatar TEXT,
  city TEXT DEFAULT 'Lahore',
  address TEXT,
  seller_profile_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin verification helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Automatic Profile Creation Trigger on Signup (Protects against ADMIN elevation)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to prevent non-admins from changing their role in profiles
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

-- 3. CITIES TABLE
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  province TEXT NOT NULL,
  popular_areas JSONB DEFAULT '[]'::jsonb,
  vendor_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  image TEXT,
  vendor_count INT DEFAULT 0,
  subcategories JSONB DEFAULT '[]'::jsonb,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. VENDORS / SELLERS TABLE
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT NOT NULL,
  subcategories JSONB DEFAULT '[]'::jsonb,
  city TEXT NOT NULL,
  locality TEXT NOT NULL,
  exact_address TEXT,
  show_exact_address BOOLEAN DEFAULT false,
  cover_image TEXT,
  avatar TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  starting_price NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 0,
  response_time TEXT DEFAULT '< 30 mins',
  experience_years INT DEFAULT 1,
  status TEXT DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
  is_featured BOOLEAN DEFAULT false,
  service_areas JSONB DEFAULT '[]'::jsonb,
  specialties JSONB DEFAULT '[]'::jsonb,
  availability_notice TEXT,
  coordinates JSONB DEFAULT '{"lat": 31.5204, "lng": 74.3587}'::jsonb,
  current_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to prevent sellers from self-approving or upgrading their plan directly
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

-- 6. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  duration TEXT,
  notice_period TEXT,
  image TEXT,
  category TEXT,
  addons JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CUSTOMER REQUESTS (Requests for Quotes)
CREATE TABLE IF NOT EXISTS public.customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  category TEXT NOT NULL,
  service_needed TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  preferred_date TEXT,
  budget NUMERIC DEFAULT 0 CHECK (budget >= 0),
  guest_count_or_quantity TEXT,
  description TEXT NOT NULL,
  delivery_method TEXT DEFAULT 'DELIVERY',
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'QUOTED', 'ACCEPTED', 'CLOSED', 'CANCELLED')),
  photos JSONB DEFAULT '[]'::jsonb,
  quote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. QUOTES (Bids from Vendors)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  request_id UUID REFERENCES public.customer_requests(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_slug TEXT,
  vendor_avatar TEXT,
  vendor_rating NUMERIC DEFAULT 5.0,
  vendor_review_count INT DEFAULT 0,
  price NUMERIC NOT NULL CHECK (price >= 0),
  service_fee NUMERIC DEFAULT 0 CHECK (service_fee >= 0),
  delivery_fee NUMERIC DEFAULT 0 CHECK (delivery_fee >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  items_breakdown JSONB DEFAULT '[]'::jsonb,
  estimated_completion TEXT,
  message TEXT,
  valid_until TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. BOOKINGS / ORDERS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  vendor_id UUID REFERENCES public.vendors(id),
  vendor_name TEXT NOT NULL,
  vendor_slug TEXT,
  service_id UUID,
  service_title TEXT NOT NULL,
  service_image TEXT,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  notes TEXT,
  delivery_address TEXT,
  delivery_type TEXT DEFAULT 'DELIVERY',
  selected_addons JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  addons_total NUMERIC DEFAULT 0 CHECK (addons_total >= 0),
  platform_fee NUMERIC DEFAULT 0 CHECK (platform_fee >= 0),
  discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED', 'CASH_ON_DELIVERY')),
  payment_method TEXT DEFAULT 'CASH_ON_DELIVERY',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to prevent booking financial manipulation
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

-- 10. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  booking_id UUID,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  seller_reply JSONB,
  status TEXT DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'FLAGGED', 'HIDDEN')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- One review per booking constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booking_review
  ON public.reviews (customer_id, booking_id)
  WHERE booking_id IS NOT NULL;

-- 11. CHAT CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_name TEXT,
  vendor_avatar TEXT,
  customer_name TEXT,
  customer_avatar TEXT,
  context_type TEXT DEFAULT 'GENERAL',
  context_id TEXT,
  context_title TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  unread_count_customer INT DEFAULT 0,
  unread_count_vendor INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text TEXT NOT NULL,
  attachment_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. NOTIFICATIONS & FAVORITES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, vendor_id)
);

-- 13. PRICING PLANS & PARTNER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC DEFAULT 0 CHECK (price_monthly >= 0),
  price_yearly NUMERIC DEFAULT 0 CHECK (price_yearly >= 0),
  features JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  cta TEXT,
  highlighted BOOLEAN DEFAULT false,
  badge TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.pricing_plans(id),
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  billing_period TEXT DEFAULT 'monthly',
  price_at_purchase NUMERIC NOT NULL,
  start_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  renewal_date TIMESTAMPTZ,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'PAID',
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to prevent self-activating subscriptions
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

-- 14. OTP VERIFICATIONS TABLE (Private, Admin/System access only)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Private to owner and admin
CREATE POLICY "Profiles read by owner or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update by owner or admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert by owner or admin"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Cities & Categories: Public read, Admin write
CREATE POLICY "Public read cities"
ON public.cities FOR SELECT USING (true);

CREATE POLICY "Admin manage cities"
ON public.cities FOR ALL
USING (public.is_admin());

CREATE POLICY "Public read categories"
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admin manage categories"
ON public.categories FOR ALL
USING (public.is_admin());

-- Vendors: Public can view approved vendors. Owners view own. Admin views all.
CREATE POLICY "Vendors viewable if approved or owner or admin"
ON public.vendors FOR SELECT
USING (
  status = 'APPROVED'
  OR auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Vendors insert own profile"
ON public.vendors FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Vendors update own profile"
ON public.vendors FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin delete vendors"
ON public.vendors FOR DELETE
USING (public.is_admin());

-- Services: Public views services of approved vendors. Vendors manage own.
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

CREATE POLICY "Vendors insert own services"
ON public.services FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY "Vendors update own services"
ON public.services FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY "Vendors delete own services"
ON public.services FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = services.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Customer Requests: Protected from public enumeration
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

CREATE POLICY "Customers create own requests"
ON public.customer_requests FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers update own open requests"
ON public.customer_requests FOR UPDATE
USING (
  (auth.uid() = customer_id AND status = 'OPEN')
  OR public.is_admin()
);

CREATE POLICY "Customers delete own open requests"
ON public.customer_requests FOR DELETE
USING (
  (auth.uid() = customer_id AND status IN ('OPEN', 'CANCELLED'))
  OR public.is_admin()
);

-- Quotes: Private between customer, quoting vendor, and admin
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

CREATE POLICY "Approved vendors create quotes"
ON public.quotes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid() AND v.status = 'APPROVED'
  )
  OR public.is_admin()
);

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

CREATE POLICY "Admin delete quotes"
ON public.quotes FOR DELETE
USING (public.is_admin());

-- Bookings: Private between customer, assigned vendor, and admin
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

CREATE POLICY "Customers create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = customer_id OR public.is_admin());

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

CREATE POLICY "Admin delete bookings"
ON public.bookings FOR DELETE
USING (public.is_admin());

-- Chat Conversations & Messages: Private to participants
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

-- Reviews
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

CREATE POLICY "Customers create reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = reviews.vendor_id AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors reply or admin update reviews"
ON public.reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = reviews.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY "Admin delete reviews"
ON public.reviews FOR DELETE
USING (public.is_admin());

-- Pricing Plans
CREATE POLICY "Public read pricing plans"
ON public.pricing_plans FOR SELECT USING (true);

CREATE POLICY "Admin manage pricing plans"
ON public.pricing_plans FOR ALL
USING (public.is_admin());

-- Seller Subscriptions
CREATE POLICY "Subscriptions viewable by vendor owner or admin"
ON public.seller_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = seller_subscriptions.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY "Vendors request subscription"
ON public.seller_subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = seller_subscriptions.vendor_id AND v.user_id = auth.uid()
  )
  OR public.is_admin()
);

CREATE POLICY "Admin manage subscriptions"
ON public.seller_subscriptions FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admin delete subscriptions"
ON public.seller_subscriptions FOR DELETE
USING (public.is_admin());

-- Notifications
CREATE POLICY "Users read own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Notifications insert policy"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- Favorites
CREATE POLICY "Customers manage own favorites"
ON public.favorites FOR ALL
USING (auth.uid() = customer_id);

-- OTP Verifications (Strictly private)
CREATE POLICY "OTP admin only select"
ON public.otp_verifications FOR SELECT
USING (public.is_admin());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ==============================================================================
-- 16. INITIAL SEED DATA (Categories, Cities, Pricing Plans)
-- ==============================================================================

-- Seed Cities
INSERT INTO public.cities (name, province, popular_areas, vendor_count, featured) VALUES
('Lahore', 'Punjab', '["Gulberg", "DHA", "Model Town", "Bahria Town", "Johar Town", "Cantt"]'::jsonb, 0, true),
('Karachi', 'Sindh', '["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "PECHS"]'::jsonb, 0, true),
('Islamabad', 'Federal', '["F-6", "F-7", "F-8", "F-10", "F-11", "E-7", "Bahria Town", "DHA-2"]'::jsonb, 0, true),
('Rawalpindi', 'Punjab', '["Saddar", "Bahria Town", "Satellite Town", "Westridge", "Chaklala"]'::jsonb, 0, false),
('Faisalabad', 'Punjab', '["D-Ground", "Madina Town", "Peoples Colony", "Kohinoor City"]'::jsonb, 0, false),
('Peshawar', 'KPK', '["Hayatabad", "University Town", "Cantt"]'::jsonb, 0, false),
('Sydney', 'New South Wales', '["Surry Hills", "Parramatta", "Bondi", "Chatswood", "Liverpool"]'::jsonb, 0, true),
('Melbourne', 'Victoria', '["Richmond", "St Kilda", "Footscray", "Carlton", "Sunbury"]'::jsonb, 0, true),
('Brisbane', 'Queensland', '["West End", "New Farm", "Chermside", "Kelvin Grove"]'::jsonb, 0, true),
('Perth', 'Western Australia', '["Subiaco", "Fremantle", "Canning Vale", "Joondalup"]'::jsonb, 0, true),
('Adelaide', 'South Australia', '["Glenelg", "Norwood", "Prospect", "Mile End"]'::jsonb, 0, false),
('Canberra', 'Australian Capital Territory', '["Civic", "Acton", "Kingston", "Belconnen"]'::jsonb, 0, false)
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (slug, name, description, icon_name, image, vendor_count, subcategories, featured) VALUES
('cakes-baking', 'Custom Cakes & Baking', 'Custom fondant cakes, cupcakes, bento cakes, brownies & artisanal sourdough breads.', 'Cake', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 0, '["Custom Fondant Cakes", "Bento & Korean Cakes", "Artisanal Brownies & Cookies", "Macarons & Gourmet Desserts", "Gluten-Free & Diet Baking"]'::jsonb, true),
('catering-food', 'Home Catering & Meals', 'Authentic home-cooked Daawat menus, daily meal subscriptions, Hi-Tea platters & finger foods.', 'Utensils', 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80', 0, '["Daawat Catering (Biryani, Qorma)", "Weekly / Monthly Lunch Subscriptions", "Hi-Tea Platters & Savory Boxes", "Artisanal Desi Ghee & Pickles", "Frozen Appetizers (Samosas, Rolls)"]'::jsonb, true),
('tailoring-fashion', 'Tailoring & Alterations', 'Stitching, designer copy tailoring, urgent alterations, hand embroidery & custom bridal wear.', 'Scissors', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80', 0, '["Ladies Suit Stitching (Casual & Semi-Formal)", "Designer Replica & Lawn Stitching", "Bridal & Heavy Embroidery (Zardozi, Gota)", "Urgent Alterations & Fitting", "Kids Traditional Outfits"]'::jsonb, true),
('henna-mehendi', 'Henna & Bridal Mehndi', 'Traditional Rajasthani, Arabic, intricate bridal mehndi, minimalist floral patterns & organic cone supplies.', 'Sparkles', 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=600&q=80', 0, '["Bridal Intricate Mehndi", "Guest / Party Mehndi Packages", "Arabic Floral & Minimalist", "White Henna & Jagua Gel", "Fresh Organic Henna Cones Delivery"]'::jsonb, true),
('handmade-gifts', 'Handmade Crafts & Gifts', 'Resin art, crochet plushies, custom calligraphy, scented soy candles & curated gift hampers.', 'Gift', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80', 0, '["Hand-poured Scented Candles", "Resin Art (Coasters, Quran Stands)", "Crochet Accessories & Toys", "Arabic / Urdu Calligraphy Frames", "Custom Nikah & Bachelorette Hampers"]'::jsonb, true),
('beauty-hair', 'Home Salon & Beauty', 'Bridal makeup, hair styling, facials, mani-pedi & relaxing organic salon services at home.', 'Flower2', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80', 0, '["Bridal & Party Hair/Makeup", "Hydra & Organic Facials", "Waxing, Threading & Polishing", "Manicure & Pedicure Services", "Keratin & Hair Protein Treatments"]'::jsonb, false)
ON CONFLICT (slug) DO NOTHING;

-- Seed Subscription Pricing Plans
INSERT INTO public.pricing_plans (slug, name, description, price_monthly, price_yearly, features, icon, cta, highlighted, badge, active) VALUES
('free', 'Starter / Free', 'Perfect for newly started home-makers testing the waters.', 0, 0, '["Basic Business Profile", "Up to 5 Service Listings", "Direct WhatsApp Contact", "Customer Reviews & Ratings", "Standard Search Placement"]'::jsonb, 'Check', 'Start For Free', false, NULL, true),
('pro', 'Pro Partner', 'Ideal for busy home chefs and artisans looking to scale orders.', 2999, 29990, '["Priority Search Ranking", "Unlimited Services & Gallery", "Custom Quotation Bidding", "Real-time Chat with Buyers", "Verified Partner Badge", "Advanced Analytics & Insights"]'::jsonb, 'Sparkles', 'Upgrade to Pro', true, 'Most Popular', true),
('featured', 'Featured Partner', 'Maximum visibility across homepage, category banners & priority leads.', 5999, 59990, '["Homepage Hero Showcase", "Top 3 Search Guarantee", "Dedicated Support Manager", "Social Media Spotlight Promo", "Zero Platform Commission", "0% Lead Service Fees"]'::jsonb, 'Crown', 'Become Featured', false, 'Best Value', true)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 17. STORAGE BUCKET & STORAGE RLS POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homebiz-media',
  'homebiz-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS: Public read
DROP POLICY IF EXISTS "Public read homebiz-media" ON storage.objects;
CREATE POLICY "Public read homebiz-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'homebiz-media');

-- Storage RLS: Authenticated upload only to permitted image folders
DROP POLICY IF EXISTS "Authenticated users upload homebiz-media" ON storage.objects;
CREATE POLICY "Authenticated users upload homebiz-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homebiz-media'
  AND (storage.foldername(name))[1] IN ('avatars', 'covers', 'gallery', 'services', 'requests')
  AND (
    array_length(storage.foldername(name), 1) = 1
    OR (storage.foldername(name))[2] = (auth.uid())::text
  )
);

-- Storage RLS: Owner or Admin update/delete
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
