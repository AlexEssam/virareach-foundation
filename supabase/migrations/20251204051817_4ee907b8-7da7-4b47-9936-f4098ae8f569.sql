-- Create b2b_extractions table
CREATE TABLE public.b2b_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  extraction_name TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  search_query TEXT,
  location TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.b2b_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own b2b extractions"
ON public.b2b_extractions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own b2b extractions"
ON public.b2b_extractions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own b2b extractions"
ON public.b2b_extractions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own b2b extractions"
ON public.b2b_extractions FOR DELETE
USING (auth.uid() = user_id);