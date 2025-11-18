-- Drop and recreate encryption functions with proper schema reference
DROP FUNCTION IF EXISTS public.encrypt_text(text, text);
DROP FUNCTION IF EXISTS public.decrypt_text(bytea, text);

-- Recreate encrypt_text with explicit pgcrypto schema reference
CREATE OR REPLACE FUNCTION public.encrypt_text(text_value text, secret_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN extensions.pgp_sym_encrypt(text_value, secret_key);
END;
$function$;

-- Recreate decrypt_text with explicit pgcrypto schema reference
CREATE OR REPLACE FUNCTION public.decrypt_text(encrypted_data bytea, secret_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN extensions.pgp_sym_decrypt(encrypted_data, secret_key);
END;
$function$;