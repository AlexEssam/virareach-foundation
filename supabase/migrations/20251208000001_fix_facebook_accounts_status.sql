-- Fix facebook_accounts status constraint to allow 'pending' and 'disconnected'
-- Drop the existing constraint
ALTER TABLE public.facebook_accounts DROP CONSTRAINT IF EXISTS facebook_accounts_status_check;

-- Add updated constraint with all valid status values
ALTER TABLE public.facebook_accounts
ADD CONSTRAINT facebook_accounts_status_check
CHECK (status IN ('active', 'inactive', 'banned', 'pending', 'disconnected'));

-- Add comment for documentation
COMMENT ON COLUMN public.facebook_accounts.status IS 'Account status: active (connected and working), inactive (not in use), banned (restricted by Facebook), pending (awaiting connection), disconnected (manually disconnected by user)';
