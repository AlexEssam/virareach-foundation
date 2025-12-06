-- Add Telegram API credentials columns to profiles table for global storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_api_id text,
ADD COLUMN IF NOT EXISTS telegram_api_hash text;