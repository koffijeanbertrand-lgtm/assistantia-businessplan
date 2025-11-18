-- Remove email column from user_credits table to prevent unnecessary data exposure
-- The user_id column is sufficient for identification
ALTER TABLE public.user_credits DROP COLUMN IF EXISTS email;