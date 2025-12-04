
-- Create google_maps_extractions table
CREATE TABLE public.google_maps_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_name TEXT NOT NULL,
  extraction_type TEXT NOT NULL, -- 'businesses', 'reviews', 'contacts'
  search_query TEXT,
  niche TEXT,
  city TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create google_maps_businesses table
CREATE TABLE public.google_maps_businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_id UUID REFERENCES public.google_maps_extractions(id) ON DELETE SET NULL,
  place_id TEXT,
  business_name TEXT NOT NULL,
  phone_number TEXT,
  rating DECIMAL(2,1),
  address TEXT,
  website TEXT,
  category TEXT,
  review_count INTEGER DEFAULT 0,
  opening_hours JSONB,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  email TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create google_maps_reviews table
CREATE TABLE public.google_maps_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.google_maps_businesses(id) ON DELETE CASCADE,
  review_id TEXT,
  reviewer_name TEXT,
  reviewer_profile_url TEXT,
  rating INTEGER,
  review_text TEXT,
  review_date TEXT,
  response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create google_maps_review_generations table for auto-generated reviews
CREATE TABLE public.google_maps_review_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.google_maps_businesses(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  business_url TEXT,
  review_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'posted', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.google_maps_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_maps_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_maps_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_maps_review_generations ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_maps_extractions
CREATE POLICY "Users can view their own google maps extractions" ON public.google_maps_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own google maps extractions" ON public.google_maps_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own google maps extractions" ON public.google_maps_extractions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own google maps extractions" ON public.google_maps_extractions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for google_maps_businesses
CREATE POLICY "Users can view their own google maps businesses" ON public.google_maps_businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own google maps businesses" ON public.google_maps_businesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own google maps businesses" ON public.google_maps_businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own google maps businesses" ON public.google_maps_businesses FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for google_maps_reviews
CREATE POLICY "Users can view their own google maps reviews" ON public.google_maps_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own google maps reviews" ON public.google_maps_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own google maps reviews" ON public.google_maps_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for google_maps_review_generations
CREATE POLICY "Users can view their own review generations" ON public.google_maps_review_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own review generations" ON public.google_maps_review_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own review generations" ON public.google_maps_review_generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own review generations" ON public.google_maps_review_generations FOR DELETE USING (auth.uid() = user_id);
