-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payment_history;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payment_history;
DROP POLICY IF EXISTS "Block public access to payment history" ON public.payment_history;

-- Create strict policy: Users can ONLY view their own payment history (authenticated required)
CREATE POLICY "Authenticated users can view own payments only"
ON public.payment_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create admin policy: Admins can view all payment history with rate limiting
CREATE POLICY "Admins can view all payments with audit"
ON public.payment_history
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND public.check_admin_access_rate_limit(auth.uid(), 'payment_history'::text)
);

-- Service role insert only (for edge functions)
CREATE POLICY "Service role insert only"
ON public.payment_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- Block anonymous access completely
CREATE POLICY "Block anonymous select"
ON public.payment_history
FOR SELECT
TO anon
USING (false);

-- Block all updates (payment history should be immutable)
CREATE POLICY "No updates allowed"
ON public.payment_history
FOR UPDATE
USING (false);

-- Block all deletes (payment history should be preserved)
CREATE POLICY "No deletes allowed"
ON public.payment_history
FOR DELETE
USING (false);