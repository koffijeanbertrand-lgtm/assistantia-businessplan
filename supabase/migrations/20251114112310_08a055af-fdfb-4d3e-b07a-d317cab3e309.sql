-- Update business_plans table to link to authenticated users
ALTER TABLE public.business_plans 
DROP COLUMN user_email,
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for business_plans
DROP POLICY IF EXISTS "Anyone can create business plans" ON public.business_plans;
DROP POLICY IF EXISTS "Users can view business plans" ON public.business_plans;

-- Users can create their own business plans
CREATE POLICY "Users can create their own business plans"
  ON public.business_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own business plans
CREATE POLICY "Users can view their own business plans"
  ON public.business_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own business plans
CREATE POLICY "Users can delete their own business plans"
  ON public.business_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_business_plans_user_id ON public.business_plans(user_id);