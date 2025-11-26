-- Add RLS policy to allow users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add explicit policy to block all public access
CREATE POLICY "Block public access to users"
ON public.users
FOR SELECT
TO anon
USING (false);

-- Also fix payment_history table exposure
CREATE POLICY "Block public access to payment history"
ON public.payment_history
FOR SELECT
TO anon
USING (false);