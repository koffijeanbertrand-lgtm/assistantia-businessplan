-- Encrypt email addresses in payment_history table for security
-- First, create a backup column with encrypted data
ALTER TABLE public.payment_history ADD COLUMN email_encrypted bytea;

-- Encrypt existing email data (if any exists)
UPDATE public.payment_history 
SET email_encrypted = pgp_sym_encrypt(email, current_setting('app.settings.encryption_key', true))
WHERE email IS NOT NULL;

-- Drop the old plain text email column
ALTER TABLE public.payment_history DROP COLUMN email;

-- Rename the encrypted column to email
ALTER TABLE public.payment_history RENAME COLUMN email_encrypted TO email;

-- Make email NOT NULL
ALTER TABLE public.payment_history ALTER COLUMN email SET NOT NULL;

-- Create a secure function to decrypt payment history for users
CREATE OR REPLACE FUNCTION public.get_user_payment_history(_user_id uuid)
RETURNS TABLE(
  id uuid,
  reference text,
  pack_type text,
  amount integer,
  currency text,
  credits_added integer,
  status text,
  email text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to view their own payment history
  IF _user_id IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Access denied. You can only view your own payment history.';
  END IF;
  
  RETURN QUERY
  SELECT 
    ph.id,
    ph.reference,
    ph.pack_type,
    ph.amount,
    ph.currency,
    ph.credits_added,
    ph.status,
    pgp_sym_decrypt(ph.email, current_setting('app.settings.encryption_key', true))::text as email,
    ph.created_at
  FROM public.payment_history ph
  WHERE ph.user_id = _user_id
  ORDER BY ph.created_at DESC;
END;
$$;