-- Add password field to facebook_accounts table for storing login credentials
ALTER TABLE public.facebook_accounts 
ADD COLUMN IF NOT EXISTS account_password text;

-- Add comment for documentation
COMMENT ON COLUMN public.facebook_accounts.account_password IS 'Encrypted password for auto-login functionality';