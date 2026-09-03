-- ==============================================================================
-- HomeBiz Pakistan - Supabase Database Schema & Initial Setup
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Automatic Profile Creation Trigger on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, city, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'CUSTOMER'),
    COALESCE(new.raw_user_meta_data->>'city', 'Lahore'),
    COALESCE(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
  status TEXT DEFAULT 'APPROVED' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  verification_status TEXT DEFAULT 'VERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
  is_featured BOOLEAN DEFAULT false,
  service_areas JSONB DEFAULT '[]'::jsonb,
  specialties JSONB DEFAULT '[]'::jsonb,
  availability_notice TEXT,
  coordinates JSONB DEFAULT '{"lat": 31.5204, "lng": 74.3587}'::jsonb,
  current_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
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
  budget NUMERIC DEFAULT 0,
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
  price NUMERIC NOT NULL,
  service_fee NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
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
  subtotal NUMERIC NOT NULL,
  addons_total NUMERIC DEFAULT 0,
  platform_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED', 'CASH_ON_DELIVERY')),
  payment_method TEXT DEFAULT 'CASH_ON_DELIVERY',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
  price_monthly NUMERIC DEFAULT 0,
  price_yearly NUMERIC DEFAULT 0,
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Public read access for marketplace browsing
CREATE POLICY "Public profiles can be viewed" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public cities read" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public vendors read" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Public services read" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public pricing plans read" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Public reviews read" ON public.reviews FOR SELECT USING (true);

-- Authenticated operations
CREATE POLICY "Vendors can update own profile" ON public.vendors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Vendors manage services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = services.vendor_id AND vendors.user_id = auth.uid())
);

-- Requests & Quotes policies
CREATE POLICY "Public requests read" ON public.customer_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated create request" ON public.customer_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers manage own request" ON public.customer_requests FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Quotes viewable by request customer or seller" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Vendors create quotes" ON public.quotes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = quotes.vendor_id AND vendors.user_id = auth.uid())
);

-- Bookings policies
CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid())
);
CREATE POLICY "Customers can create booking" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Participants can update booking" ON public.bookings FOR UPDATE USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid())
);

-- Chat messages policies
CREATE POLICY "Conversation participants can view" ON public.conversations FOR SELECT USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = conversations.vendor_id AND vendors.user_id = auth.uid())
);
CREATE POLICY "Conversation create" ON public.conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages viewable by participants" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = messages.conversation_id AND (
      c.customer_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = c.vendor_id AND v.user_id = auth.uid())
    )
  )
);
CREATE POLICY "Messages insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ==============================================================================
-- INITIAL SEED DATA (Categories, Cities, Pricing Plans)
-- ==============================================================================

-- Seed Cities
INSERT INTO public.cities (name, province, popular_areas, vendor_count, featured) VALUES
('Lahore', 'Punjab', '["Gulberg", "DHA", "Model Town", "Bahria Town", "Johar Town", "Cantt"]'::jsonb, 12, true),
('Karachi', 'Sindh', '["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "PECHS"]'::jsonb, 8, true),
('Islamabad', 'Federal', '["F-6", "F-7", "F-8", "F-10", "F-11", "E-7", "Bahria Town", "DHA-2"]'::jsonb, 6, true),
('Rawalpindi', 'Punjab', '["Saddar", "Bahria Town", "Satellite Town", "Westridge", "Chaklala"]'::jsonb, 3, false),
('Faisalabad', 'Punjab', '["D-Ground", "Madina Town", "Peoples Colony", "Kohinoor City"]'::jsonb, 2, false),
('Peshawar', 'KPK', '["Hayatabad", "University Town", "Cantt"]'::jsonb, 2, false)
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (slug, name, description, icon_name, image, vendor_count, subcategories, featured) VALUES
('cakes-baking', 'Custom Cakes & Baking', 'Custom fondant cakes, cupcakes, bento cakes, brownies & artisanal sourdough breads.', 'Cake', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', 14, '["Custom Fondant Cakes", "Bento & Korean Cakes", "Artisanal Brownies & Cookies", "Macarons & Gourmet Desserts", "Gluten-Free & Diet Baking"]'::jsonb, true),
('catering-food', 'Home Catering & Meals', 'Authentic home-cooked Daawat menus, daily meal subscriptions, Hi-Tea platters & finger foods.', 'Utensils', 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80', 11, '["Daawat Catering (Biryani, Qorma)", "Weekly / Monthly Lunch Subscriptions", "Hi-Tea Platters & Savory Boxes", "Artisanal Desi Ghee & Pickles", "Frozen Appetizers (Samosas, Rolls)"]'::jsonb, true),
('tailoring-fashion', 'Tailoring & Alterations', 'Stitching, designer copy tailoring, urgent alterations, hand embroidery & custom bridal wear.', 'Scissors', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80', 9, '["Ladies Suit Stitching (Casual & Semi-Formal)", "Designer Replica & Lawn Stitching", "Bridal & Heavy Embroidery (Zardozi, Gota)", "Urgent Alterations & Fitting", "Kids Traditional Outfits"]'::jsonb, true),
('henna-mehendi', 'Henna & Bridal Mehndi', 'Traditional Rajasthani, Arabic, intricate bridal mehndi, minimalist floral patterns & organic cone supplies.', 'Sparkles', 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=600&q=80', 8, '["Bridal Intricate Mehndi", "Guest / Party Mehndi Packages", "Arabic Floral & Minimalist", "White Henna & Jagua Gel", "Fresh Organic Henna Cones Delivery"]'::jsonb, true),
('handmade-gifts', 'Handmade Crafts & Gifts', 'Resin art, crochet plushies, custom calligraphy, scented soy candles & curated gift hampers.', 'Gift', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80', 7, '["Hand-poured Scented Candles", "Resin Art (Coasters, Quran Stands)", "Crochet Accessories & Toys", "Arabic / Urdu Calligraphy Frames", "Custom Nikah & Bachelorette Hampers"]'::jsonb, true),
('beauty-hair', 'Home Salon & Beauty', 'Bridal makeup, hair styling, facials, mani-pedi & relaxing organic salon services at home.', 'Flower2', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80', 6, '["Bridal & Party Hair/Makeup", "Hydra & Organic Facials", "Waxing, Threading & Polishing", "Manicure & Pedicure Services", "Keratin & Hair Protein Treatments"]'::jsonb, false)
ON CONFLICT (slug) DO NOTHING;

-- Seed Subscription Pricing Plans
INSERT INTO public.pricing_plans (slug, name, description, price_monthly, price_yearly, features, icon, cta, highlighted, badge, active) VALUES
('free', 'Starter / Free', 'Perfect for newly started home-makers testing the waters.', 0, 0, '["Basic Business Profile", "Up to 5 Service Listings", "Direct WhatsApp Contact", "Customer Reviews & Ratings", "Standard Search Placement"]'::jsonb, 'Check', 'Start For Free', false, NULL, true),
('pro', 'Pro Partner', 'Ideal for busy home chefs and artisans looking to scale orders.', 2999, 29990, '["Priority Search Ranking", "Unlimited Services & Gallery", "Custom Quotation Bidding", "Real-time Chat with Buyers", "Verified Partner Badge", "Advanced Analytics & Insights"]'::jsonb, 'Sparkles', 'Upgrade to Pro', true, 'Most Popular', true),
('featured', 'Featured Partner', 'Maximum visibility across homepage, category banners & priority leads.', 5999, 59990, '["Homepage Hero Showcase", "Top 3 Search Guarantee", "Dedicated Support Manager", "Social Media Spotlight Promo", "Zero Platform Commission", "0% Lead Service Fees"]'::jsonb, 'Crown', 'Become Featured', false, 'Best Value', true)
ON CONFLICT (slug) DO NOTHING;
