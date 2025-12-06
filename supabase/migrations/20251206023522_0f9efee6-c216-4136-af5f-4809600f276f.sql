-- Create telegram_verification_codes table for bot-based credential registration
CREATE TABLE public.telegram_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.telegram_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
CREATE POLICY "Users can view their own verification codes"
ON public.telegram_verification_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own codes
CREATE POLICY "Users can insert their own verification codes"
ON public.telegram_verification_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own codes
CREATE POLICY "Users can update their own verification codes"
ON public.telegram_verification_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own codes
CREATE POLICY "Users can delete their own verification codes"
ON public.telegram_verification_codes
FOR DELETE
USING (auth.uid() = user_id);