-- Drop the vulnerable RLS policies that expose unactivated licenses
DROP POLICY IF EXISTS "Users can find licenses by key" ON public.licenses;
DROP POLICY IF EXISTS "Users can activate licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can view their own licenses" ON public.licenses;

-- Create a restricted SELECT policy - users can ONLY see their own activated licenses
CREATE POLICY "Users can view their own licenses"
ON public.licenses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a secure function to activate licenses (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.activate_license(license_key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  license_record licenses%ROWTYPE;
  result jsonb;
BEGIN
  -- Find the license by key
  SELECT * INTO license_record
  FROM licenses
  WHERE license_key = license_key_input;

  -- Check if license exists
  IF license_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid license key');
  END IF;

  -- Check if license is already activated by another user
  IF license_record.user_id IS NOT NULL AND license_record.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'License is already activated on another account');
  END IF;

  -- Check if license is already activated by this user
  IF license_record.user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'License is already activated on this account');
  END IF;

  -- Check if license is expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'License has expired');
  END IF;

  -- Check if license status is valid for activation
  IF license_record.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'error', 'License has been revoked');
  END IF;

  -- Activate the license
  UPDATE licenses
  SET 
    user_id = auth.uid(),
    status = 'active',
    activated_at = now()
  WHERE id = license_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'License activated successfully',
    'license_key', license_record.license_key,
    'expires_at', license_record.expires_at
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_license(text) TO authenticated;