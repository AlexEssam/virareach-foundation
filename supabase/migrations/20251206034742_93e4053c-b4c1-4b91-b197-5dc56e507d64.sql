-- Add wa_session_id column to whatsapp_accounts table
ALTER TABLE public.whatsapp_accounts 
ADD COLUMN IF NOT EXISTS wa_session_id TEXT;