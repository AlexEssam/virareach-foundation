-- Add email and password columns for Instagram account credentials
ALTER TABLE public.instagram_accounts 
ADD COLUMN account_email text,
ADD COLUMN account_password text;