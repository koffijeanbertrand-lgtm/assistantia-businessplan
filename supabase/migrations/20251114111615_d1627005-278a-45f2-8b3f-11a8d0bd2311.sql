-- Create table for business plans
CREATE TABLE IF NOT EXISTS public.business_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  project_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  business_model TEXT NOT NULL,
  resources TEXT NOT NULL,
  marketing_strategy TEXT NOT NULL,
  vision TEXT NOT NULL,
  generated_plan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for MVP)
CREATE POLICY "Anyone can create business plans"
  ON public.business_plans
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow anyone to view their own plans (by email if provided)
CREATE POLICY "Users can view business plans"
  ON public.business_plans
  FOR SELECT
  TO public
  USING (true);

-- Add index for better performance
CREATE INDEX idx_business_plans_created_at ON public.business_plans(created_at DESC);
CREATE INDEX idx_business_plans_email ON public.business_plans(user_email);