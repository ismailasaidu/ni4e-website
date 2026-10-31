-- NI4E Admin CMS upgrade: enables the institutional About page record type.
-- Run in Supabase SQL Editor before creating/publishing About Page records.
DO $$
DECLARE constraint_name text;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'site_content' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%content_type%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.site_content DROP CONSTRAINT %I', constraint_name);
  END IF;
  ALTER TABLE public.site_content
    ADD CONSTRAINT site_content_content_type_check
    CHECK (content_type IN ('news','event','publication','chapter','executive','past_president','technical_division','document','project','committee','institutional_page'));
END $$;

-- Keep CMS edits visible to public pages while retaining admin-only writes.
-- Existing RLS policies from the main NI4E schema remain in force.
CREATE INDEX IF NOT EXISTS site_content_public_lookup_idx
  ON public.site_content (content_type, published, updated_at DESC);
