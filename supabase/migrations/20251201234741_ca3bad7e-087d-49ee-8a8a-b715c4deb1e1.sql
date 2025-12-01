-- Encrypt payment reference field in payment_history table
-- This prevents transaction tracing if RLS policies are bypassed

-- Step 1: Add new encrypted column
ALTER TABLE public.payment_history ADD COLUMN reference_encrypted bytea;

-- Step 2: Migrate existing data (encrypt existing references)
UPDATE public.payment_history 
SET reference_encrypted = pgp_sym_encrypt(reference, 'ENCRYPTION_KEY')
WHERE reference_encrypted IS NULL;

-- Step 3: Drop old column and rename new one
ALTER TABLE public.payment_history DROP COLUMN reference;
ALTER TABLE public.payment_history RENAME COLUMN reference_encrypted TO reference;

-- Step 4: Make it NOT NULL
ALTER TABLE public.payment_history ALTER COLUMN reference SET NOT NULL;

-- Step 5: Update the get_user_payment_history function to decrypt reference
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
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow users to view their own payment history
  IF _user_id IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Access denied. You can only view your own payment history.';
  END IF;
  
  RETURN QUERY
  SELECT 
    ph.id,
    pgp_sym_decrypt(ph.reference, current_setting('app.settings.encryption_key', true))::text as reference,
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

-- Add comment for documentation
COMMENT ON COLUMN public.payment_history.reference IS 'Encrypted Paystack payment reference - decrypted only through secure RPC function';