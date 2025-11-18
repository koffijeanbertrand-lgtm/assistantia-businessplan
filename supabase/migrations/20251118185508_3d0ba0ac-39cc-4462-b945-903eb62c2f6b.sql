-- Fix search_path for encryption functions
DROP FUNCTION IF EXISTS public.encrypt_text(text, text);
DROP FUNCTION IF EXISTS public.decrypt_text(bytea, text);

CREATE OR REPLACE FUNCTION public.encrypt_text(text_value text, secret_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN pgp_sym_encrypt(text_value, secret_key);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_text(encrypted_data bytea, secret_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, secret_key);
END;
$function$;