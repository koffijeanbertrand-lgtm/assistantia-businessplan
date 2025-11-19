-- Drop the existing policy that allows access by email
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payment_history;

-- Create new policy that only allows access by user_id
CREATE POLICY "Users can view their own payments"
ON public.payment_history
FOR SELECT
USING (auth.uid() = user_id);