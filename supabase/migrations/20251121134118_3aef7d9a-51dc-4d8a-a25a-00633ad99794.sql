-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));