-- ==============================================================================
-- MIGRATION 003: FIX STORAGE.OBJECTS RLS & ENFORCE AUTHENTICATED UPLOADS ONLY
-- HomeBiz Pakistan — Storage Security Hardening
-- ==============================================================================

-- 1. Ensure bucket settings: Public read, 5MB limit, strict image MIME types
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

-- 2. Cleanly drop any insecure, permissive, anon, or legacy policies on storage.objects
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on storage.objects that allow non-authenticated INSERT, UPDATE, DELETE
    -- or any existing policy tied to homebiz-media
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND (
            policyname ILIKE '%homebiz%'
            OR policyname ILIKE '%media%'
            OR (
              cmd IN ('INSERT', 'ALL', 'UPDATE', 'DELETE')
              AND ('public' = ANY(roles) OR 'anon' = ANY(roles) OR roles IS NULL OR array_length(roles, 1) = 0)
            )
          )
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', pol.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Also explicitly drop known legacy/default policy names if present
DROP POLICY IF EXISTS "Public read homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin update homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin delete homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Public upload homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to homebiz-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow all" ON storage.objects;
DROP POLICY IF EXISTS "Objects are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for all users" ON storage.objects;

-- 3. Policy: Public READ for storefront display
CREATE POLICY "Public read homebiz-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'homebiz-media');

-- 4. Policy: Strict Authenticated INSERT to allowed folders only
-- Anon users are strictly BLOCKED from inserting.
-- Allowed folders: avatars, covers, gallery, services, requests.
-- Path security: prevents writing into another user's subfolder if user folders are used.
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

-- 5. Policy: Owner or Admin UPDATE
CREATE POLICY "Owner or admin update homebiz-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'homebiz-media'
  AND (auth.uid() = owner OR public.is_admin())
);

-- 6. Policy: Owner or Admin DELETE
CREATE POLICY "Owner or admin delete homebiz-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'homebiz-media'
  AND (auth.uid() = owner OR public.is_admin())
);


-- 8. Inspection RPC helper to allow live verification of storage policies
CREATE OR REPLACE FUNCTION public.check_storage_objects_policies()
RETURNS TABLE (
  policyname TEXT,
  cmd TEXT,
  roles NAME[],
  qual TEXT,
  with_check TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT policyname::text, cmd::text, roles, qual::text, with_check::text
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects';
$$;

GRANT EXECUTE ON FUNCTION public.check_storage_objects_policies() TO anon, authenticated;
