-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted email column
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN encrypted_email bytea;

-- Create function to encrypt email
CREATE OR REPLACE FUNCTION public.encrypt_email(email_text text, secret_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_encrypt(email_text, secret_key);
END;
$$;

-- Create function to decrypt email
CREATE OR REPLACE FUNCTION public.decrypt_email(encrypted_data bytea, secret_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, secret_key);
END;
$$;

-- Migrate existing emails to encrypted format
-- Note: Uses a database-level secret for encryption key
UPDATE public.newsletter_subscribers
SET encrypted_email = pgp_sym_encrypt(
  email, 
  current_setting('app.settings.encryption_key', true)
)
WHERE encrypted_email IS NULL AND email IS NOT NULL;

-- Drop the old plaintext email column
ALTER TABLE public.newsletter_subscribers 
DROP COLUMN email;

-- Rename encrypted column to email
ALTER TABLE public.newsletter_subscribers 
RENAME COLUMN encrypted_email TO email;

-- Make email column NOT NULL
ALTER TABLE public.newsletter_subscribers 
ALTER COLUMN email SET NOT NULL;

-- Update get_newsletter_subscribers_paginated function to decrypt emails
CREATE OR REPLACE FUNCTION public.get_newsletter_subscribers_paginated(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE(id uuid, email text, subscribed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  IF NOT public.check_admin_access_rate_limit(auth.uid(), 'newsletter_subscribers') THEN
    RAISE EXCEPTION 'Rate limit check failed.';
  END IF;
  
  IF _limit > 50 THEN
    RAISE EXCEPTION 'Maximum limit is 50 rows per query.';
  END IF;
  
  RETURN QUERY
  SELECT 
    ns.id, 
    pgp_sym_decrypt(ns.email, current_setting('app.settings.encryption_key', true))::text as email,
    ns.subscribed_at
  FROM public.newsletter_subscribers ns
  ORDER BY ns.subscribed_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Update get_newsletter_subscribers_safe function to decrypt emails
CREATE OR REPLACE FUNCTION public.get_newsletter_subscribers_safe(_limit integer DEFAULT 10, _offset integer DEFAULT 0)
RETURNS TABLE(id uuid, email text, subscribed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  IF NOT public.check_admin_access_rate_limit(auth.uid(), 'newsletter_subscribers') THEN
    RAISE EXCEPTION 'Rate limit exceeded.';
  END IF;
  
  IF _limit > 10 THEN
    RAISE EXCEPTION 'Maximum limit is 10 rows per query for security.';
  END IF;
  
  RETURN QUERY
  SELECT 
    ns.id, 
    pgp_sym_decrypt(ns.email, current_setting('app.settings.encryption_key', true))::text as email,
    ns.subscribed_at
  FROM public.newsletter_subscribers ns
  ORDER BY ns.subscribed_at DESC
  LIMIT _limit
  OFFSET _offset;
  
  INSERT INTO public.admin_access_logs (admin_user_id, table_name, action, ip_address)
  VALUES (
    auth.uid(), 
    'newsletter_subscribers', 
    'SELECT - Retrieved ' || _limit || ' records at offset ' || _offset,
    inet_client_addr()::text
  );
END;
$$;

-- Update check_contact_rate_limit to handle encrypted emails
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(submitter_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  encrypted_email_value bytea;
BEGIN
  IF submitter_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN false;
  END IF;
  
  IF char_length(submitter_email) < 3 OR char_length(submitter_email) > 255 THEN
    RETURN false;
  END IF;
  
  -- Encrypt the email for comparison
  encrypted_email_value := pgp_sym_encrypt(submitter_email, current_setting('app.settings.encryption_key', true));
  
  SELECT COUNT(*)
  INTO recent_count
  FROM public.newsletter_subscribers
  WHERE email = encrypted_email_value
    AND subscribed_at > NOW() - INTERVAL '5 minutes';
  
  RETURN recent_count < 2;
END;
$$;