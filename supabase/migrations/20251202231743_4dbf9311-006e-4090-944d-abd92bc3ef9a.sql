-- Add encrypted email column
ALTER TABLE public.users ADD COLUMN email_encrypted bytea;

-- Migrate existing emails to encrypted format
UPDATE public.users 
SET email_encrypted = pgp_sym_encrypt(email, current_setting('app.settings.encryption_key', true))
WHERE email IS NOT NULL;

-- Drop old plain text email column
ALTER TABLE public.users DROP COLUMN email;

-- Rename encrypted column to email
ALTER TABLE public.users RENAME COLUMN email_encrypted TO email;

-- Also encrypt full_name for complete protection
ALTER TABLE public.users ADD COLUMN full_name_encrypted bytea;

UPDATE public.users 
SET full_name_encrypted = pgp_sym_encrypt(full_name, current_setting('app.settings.encryption_key', true))
WHERE full_name IS NOT NULL;

ALTER TABLE public.users DROP COLUMN full_name;

ALTER TABLE public.users RENAME COLUMN full_name_encrypted TO full_name;

-- Create a secure function to get decrypted user data (only for own user or admins)
CREATE OR REPLACE FUNCTION public.get_user_data_safe(_user_id uuid)
RETURNS TABLE(id uuid, email text, full_name text, created_at timestamp without time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to view their own data or admins to view all
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required';
  END IF;
  
  IF auth.uid() != _user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. You can only view your own data.';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    pgp_sym_decrypt(u.email, current_setting('app.settings.encryption_key', true))::text as email,
    pgp_sym_decrypt(u.full_name, current_setting('app.settings.encryption_key', true))::text as full_name,
    u.created_at
  FROM public.users u
  WHERE u.id = _user_id;
END;
$$;

-- Create admin function to get all users with decrypted data
CREATE OR REPLACE FUNCTION public.get_all_users_safe(_limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE(id uuid, email text, full_name text, created_at timestamp without time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  IF _limit > 100 THEN
    RAISE EXCEPTION 'Maximum limit is 100 rows per query.';
  END IF;
  
  -- Log admin access
  INSERT INTO public.admin_access_logs (admin_user_id, table_name, action, ip_address)
  VALUES (auth.uid(), 'users', 'SELECT - Retrieved ' || _limit || ' records at offset ' || _offset, inet_client_addr()::text);
  
  RETURN QUERY
  SELECT 
    u.id,
    pgp_sym_decrypt(u.email, current_setting('app.settings.encryption_key', true))::text as email,
    pgp_sym_decrypt(u.full_name, current_setting('app.settings.encryption_key', true))::text as full_name,
    u.created_at
  FROM public.users u
  ORDER BY u.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;