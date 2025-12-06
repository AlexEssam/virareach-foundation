-- Add ElevenLabs API key column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT;

-- Create custom_voices table for user's cloned voices
CREATE TABLE IF NOT EXISTS public.custom_voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  elevenlabs_voice_id TEXT NOT NULL,
  sample_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_voices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_voices
CREATE POLICY "Users can view their own custom voices"
ON public.custom_voices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom voices"
ON public.custom_voices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom voices"
ON public.custom_voices
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom voices"
ON public.custom_voices
FOR DELETE
USING (auth.uid() = user_id);