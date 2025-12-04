-- Create x_accounts table
CREATE TABLE public.x_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  account_name TEXT,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  access_token_secret TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  tweets_count INTEGER DEFAULT 0,
  daily_tweet_count INTEGER DEFAULT 0,
  daily_like_count INTEGER DEFAULT 0,
  daily_follow_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create x_extractions table
CREATE TABLE public.x_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  source TEXT,
  source_username TEXT,
  country_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  results JSONB,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create x_tweets table for scheduling
CREATE TABLE public.x_tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.x_accounts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  tweet_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create x_interactions table
CREATE TABLE public.x_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.x_accounts(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL,
  target_id TEXT,
  target_username TEXT,
  target_tweet_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Create x_trends table for caching trends
CREATE TABLE public.x_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  trends JSONB,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.x_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_trends ENABLE ROW LEVEL SECURITY;

-- RLS policies for x_accounts
CREATE POLICY "Users can view their own x accounts" ON public.x_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own x accounts" ON public.x_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own x accounts" ON public.x_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own x accounts" ON public.x_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for x_extractions
CREATE POLICY "Users can view their own x extractions" ON public.x_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own x extractions" ON public.x_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for x_tweets
CREATE POLICY "Users can view their own x tweets" ON public.x_tweets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own x tweets" ON public.x_tweets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own x tweets" ON public.x_tweets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own x tweets" ON public.x_tweets FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for x_interactions
CREATE POLICY "Users can view their own x interactions" ON public.x_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own x interactions" ON public.x_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own x interactions" ON public.x_interactions FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for x_trends
CREATE POLICY "Users can view their own x trends" ON public.x_trends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own x trends" ON public.x_trends FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_x_accounts_updated_at BEFORE UPDATE ON public.x_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();