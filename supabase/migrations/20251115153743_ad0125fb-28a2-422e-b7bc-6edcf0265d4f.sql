-- Grant admin role to marieannickndia95@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('8531e810-5b2a-469d-88e8-eab55dfb49ef', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;