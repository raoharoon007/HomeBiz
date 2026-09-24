-- ==============================================================================
-- HomeBiz Pakistan & Australia - Security Hardening Patch 002
-- Migration: 002_fix_security_issues.sql
-- Description:
--   1. Fixes 42P17 infinite recursion between customer_requests and quotes
--   2. Removes lingering public SELECT data leak on profiles table
--   3. Adds database-level trigger for strict review-to-booking validation
--   4. Initializes storage bucket and storage RLS policies for homebiz-media
-- ==============================================================================

-- ==============================================================================
-- 1. FIX INFINITE RECURSION (customer_requests <-> quotes)
-- ==============================================================================

-- Drop existing recursive policies
DROP POLICY IF EXISTS "Customer requests access policy" ON public.customer_requests;
DROP POLICY IF EXISTS "Customers create own requests" ON public.customer_requests;
DROP POLICY IF EXISTS "Customers update own open requests" ON public.customer_requests;
DROP POLICY IF EXISTS "Customers delete own open requests" ON public.customer_requests;

DROP POLICY IF EXISTS "Quotes private view" ON public.quotes;
DROP POLICY IF EXISTS "Approved vendors create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Quotes update policy" ON public.quotes;
DROP POLICY IF EXISTS "Admin delete quotes" ON public.quotes;

-- Helper Function 1: Check request ownership safely without triggering customer_requests RLS
CREATE OR REPLACE FUNCTION public.is_request_owner(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customer_requests
    WHERE id = p_request_id AND customer_id = auth.uid()
  );
$$;

-- Helper Function 2: Check if vendor has submitted quote safely without triggering quotes RLS
CREATE OR REPLACE FUNCTION public.vendor_has_quote_for_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.vendors v ON v.id = q.vendor_id
    WHERE q.request_id = p_request_id AND v.user_id = auth.uid()
  );
$$;

-- Non-recursive customer_requests SELECT policy
CREATE POLICY "Customer requests access policy"
ON public.customer_requests FOR SELECT
TO authenticated
USING (
  -- Customer owns the request
  auth.uid() = customer_id
  -- OR approved vendor in matching category or city
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.user_id = auth.uid()
      AND v.status = 'APPROVED'
      AND (v.category = customer_requests.category OR lower(v.city) = lower(customer_requests.city))
  )
  -- OR vendor already quoted on this request (via security definer helper)
  OR public.vendor_has_quote_for_request(customer_requests.id)
  -- OR admin
  OR public.is_admin()
);

CREATE POLICY "Customers create own requests"
ON public.customer_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers update own open requests"
ON public.customer_requests FOR UPDATE
TO authenticated
USING (
  (auth.uid() = customer_id AND status = 'OPEN')
  OR public.is_admin()
);

CREATE POLICY "Customers delete own open requests"
ON public.customer_requests FOR DELETE
TO authenticated
USING (
  (auth.uid() = customer_id AND status IN ('OPEN', 'CANCELLED'))
  OR public.is_admin()
);

-- Non-recursive quotes SELECT policy
CREATE POLICY "Quotes private view"
ON public.quotes FOR SELECT
TO authenticated
USING (
  -- Customer owns the request that this quote is for (checked via helper without recursion)
  public.is_request_owner(quotes.request_id)
  -- OR vendor authored this quote
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid()
  )
  -- OR admin
  OR public.is_admin()
);

CREATE POLICY "Approved vendors create quotes"
ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid() AND v.status = 'APPROVED'
  )
  OR public.is_admin()
);

CREATE POLICY "Quotes update policy"
ON public.quotes FOR UPDATE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id AND v.user_id = auth.uid()
  ) AND status = 'PENDING')
  OR public.is_request_owner(quotes.request_id)
  OR public.is_admin()
);

CREATE POLICY "Admin delete quotes"
ON public.quotes FOR DELETE
TO authenticated
USING (public.is_admin());


-- ==============================================================================
-- 2. REMOVE PUBLIC PROFILES DATA LEAK
-- ==============================================================================

-- Drop ALL existing policies on profiles dynamically to clear any lingering legacy public read policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Enforce strict authenticated-only access (owner or admin)
CREATE POLICY "Profiles read by owner or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update by owner or admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert by owner or admin"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());


-- ==============================================================================
-- 3. STRENGTHEN REVIEW BOOKING VALIDATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_review_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- 1. Ensure review author is authenticated and matches customer_id
  IF auth.uid() IS NULL OR NEW.customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Reviews must be submitted by the authenticated customer (unauthorized)';
  END IF;

  -- 2. Prevent vendor from reviewing their own storefront
  IF EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = NEW.vendor_id AND v.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Vendors cannot submit reviews for their own storefront';
  END IF;

  -- 3. If booking_id is provided, validate booking relationship and completion
  IF NEW.booking_id IS NOT NULL THEN
    SELECT id, customer_id, vendor_id, status
    INTO v_booking
    FROM public.bookings
    WHERE id = NEW.booking_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Referenced booking does not exist';
    END IF;

    IF v_booking.customer_id <> auth.uid() THEN
      RAISE EXCEPTION 'You can only review bookings made by your account';
    END IF;

    IF v_booking.vendor_id <> NEW.vendor_id THEN
      RAISE EXCEPTION 'Booking vendor does not match review vendor';
    END IF;

    IF v_booking.status NOT IN ('COMPLETED', 'CONFIRMED') THEN
      RAISE EXCEPTION 'Only completed or confirmed bookings are eligible for review';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_review_eligibility ON public.reviews;
CREATE TRIGGER trg_validate_review_eligibility
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE PROCEDURE public.validate_review_eligibility();


-- ==============================================================================
-- 4. STORAGE BUCKET INITIALIZATION & POLICIES
-- ==============================================================================

-- Create bucket if not exists
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

-- Storage RLS: Public read for storefront display
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
