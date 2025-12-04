-- Add profile_path column to instagram_accounts
ALTER TABLE public.instagram_accounts 
ADD COLUMN profile_path text;