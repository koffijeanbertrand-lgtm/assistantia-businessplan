-- Encrypt contact_messages sensitive data - Fixed approach

-- First, create encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_text(text_value text, secret_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgp_sym_encrypt(text_value, secret_key);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_text(encrypted_data bytea, secret_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, secret_key);
END;
$function$;

-- Backup and transform existing data
DO $$
DECLARE
  encryption_key text := 'contact_messages_encryption_key_2025';
  rec record;
BEGIN
  -- Create backup table
  CREATE TEMP TABLE IF NOT EXISTS contact_messages_backup AS 
  SELECT * FROM public.contact_messages;
  
  -- Drop and recreate table
  DROP TABLE IF EXISTS public.contact_messages CASCADE;
  
  CREATE TABLE public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name BYTEA NOT NULL,
    email BYTEA NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    anonymized_at TIMESTAMP WITH TIME ZONE
  );
  
  -- Enable RLS
  ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
  
  -- Migrate existing data with encryption
  FOR rec IN SELECT * FROM contact_messages_backup LOOP
    INSERT INTO public.contact_messages (id, name, email, message, read, created_at, anonymized_at)
    VALUES (
      rec.id,
      pgp_sym_encrypt(rec.name, encryption_key),
      pgp_sym_encrypt(rec.email, encryption_key),
      rec.message,
      rec.read,
      rec.created_at,
      rec.anonymized_at
    );
  END LOOP;
END $$;

-- Re-create policies
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can read contact messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) AND is_trusted_admin_ip());

CREATE POLICY "Block public access to contact messages"
ON public.contact_messages
FOR SELECT
USING (false);

CREATE POLICY "Only admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create safe function for admins to read contact messages
CREATE OR REPLACE FUNCTION public.get_contact_messages_safe(_limit integer DEFAULT 10, _offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid, 
  name text, 
  email text, 
  message text,
  read boolean,
  created_at timestamp with time zone,
  anonymized_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text := 'contact_messages_encryption_key_2025';
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  IF NOT public.is_trusted_admin_ip() THEN
    RAISE EXCEPTION 'Access denied. Untrusted IP address.';
  END IF;
  
  IF _limit > 50 THEN
    RAISE EXCEPTION 'Maximum limit is 50 rows per query for security.';
  END IF;
  
  RETURN QUERY
  SELECT 
    cm.id,
    pgp_sym_decrypt(cm.name, encryption_key)::text as name,
    pgp_sym_decrypt(cm.email, encryption_key)::text as email,
    cm.message,
    cm.read,
    cm.created_at,
    cm.anonymized_at
  FROM public.contact_messages cm
  ORDER BY cm.created_at DESC
  LIMIT _limit
  OFFSET _offset;
  
  INSERT INTO public.admin_access_logs (admin_user_id, table_name, action, ip_address)
  VALUES (
    auth.uid(), 
    'contact_messages', 
    'SELECT - Retrieved ' || _limit || ' encrypted records at offset ' || _offset,
    inet_client_addr()::text
  );
END;
$function$;

-- Update anonymization function
CREATE OR REPLACE FUNCTION public.anonymize_old_contact_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  anonymized_count INTEGER;
  encryption_key text := 'contact_messages_encryption_key_2025';
BEGIN
  UPDATE public.contact_messages
  SET 
    email = pgp_sym_encrypt('anonymized_' || id::text || '@deleted.local', encryption_key),
    name = pgp_sym_encrypt('Anonymized User', encryption_key),
    message = '[Message anonymized after retention period]',
    anonymized_at = NOW()
  WHERE 
    created_at < NOW() - INTERVAL '90 days'
    AND anonymized_at IS NULL
    AND read = true;
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  
  INSERT INTO public.admin_access_logs (admin_user_id, table_name, action, ip_address)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'contact_messages', 
    'ANONYMIZE - ' || anonymized_count || ' encrypted messages', 
    'system'
  );
  
  RETURN anonymized_count;
END;
$function$;