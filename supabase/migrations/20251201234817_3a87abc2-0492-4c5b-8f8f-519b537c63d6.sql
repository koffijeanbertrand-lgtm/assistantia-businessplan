-- Create function to check if a payment reference already exists
-- This is needed because encrypted references can't be compared directly with SQL WHERE clauses

CREATE OR REPLACE FUNCTION public.check_payment_reference_exists(
  _reference text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  payment_count integer;
  decrypted_ref text;
BEGIN
  -- Check each payment record for this user
  FOR decrypted_ref IN
    SELECT pgp_sym_decrypt(reference, current_setting('app.settings.encryption_key', true))::text
    FROM public.payment_history
    WHERE user_id = _user_id
  LOOP
    IF decrypted_ref = _reference THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;