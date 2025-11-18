-- Create user_credits table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id OR auth.email() = email);

-- Users can insert their own credits record
CREATE POLICY "Users can insert their own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.email() = email);

-- Service role can update credits (for payment processing)
CREATE POLICY "Service role can update credits"
ON public.user_credits
FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for payment history
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  pack_type TEXT NOT NULL,
  credits_added INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view their own payments"
ON public.payment_history
FOR SELECT
USING (auth.uid() = user_id OR auth.email() = email);

-- Service role can insert payment records
CREATE POLICY "Service role can insert payments"
ON public.payment_history
FOR INSERT
WITH CHECK (true);