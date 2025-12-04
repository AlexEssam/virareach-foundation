-- Create tiktok_accounts table
CREATE TABLE public.tiktok_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  username TEXT NOT NULL,
  account_name TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  daily_follow_count INTEGER DEFAULT 0,
  daily_unfollow_count INTEGER DEFAULT 0,
  daily_dm_count INTEGER DEFAULT 0,
  session_data TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tiktok_extractions table
CREATE TABLE public.tiktok_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  extraction_type TEXT NOT NULL,
  source TEXT,
  source_username TEXT,
  hashtag TEXT,
  country_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create tiktok_follows table
CREATE TABLE public.tiktok_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  account_id UUID REFERENCES public.tiktok_accounts(id),
  target_username TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Create tiktok_campaigns table
CREATE TABLE public.tiktok_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  account_id UUID REFERENCES public.tiktok_accounts(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  recipients TEXT[],
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_campaigns ENABLE ROW LEVEL SECURITY;

-- tiktok_accounts policies
CREATE POLICY "Users can view their own tiktok accounts"
ON public.tiktok_accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiktok accounts"
ON public.tiktok_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiktok accounts"
ON public.tiktok_accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tiktok accounts"
ON public.tiktok_accounts FOR DELETE USING (auth.uid() = user_id);

-- tiktok_extractions policies
CREATE POLICY "Users can view their own tiktok extractions"
ON public.tiktok_extractions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiktok extractions"
ON public.tiktok_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- tiktok_follows policies
CREATE POLICY "Users can view their own tiktok follows"
ON public.tiktok_follows FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiktok follows"
ON public.tiktok_follows FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiktok follows"
ON public.tiktok_follows FOR UPDATE USING (auth.uid() = user_id);

-- tiktok_campaigns policies
CREATE POLICY "Users can view their own tiktok campaigns"
ON public.tiktok_campaigns FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiktok campaigns"
ON public.tiktok_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiktok campaigns"
ON public.tiktok_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_tiktok_accounts_updated_at
BEFORE UPDATE ON public.tiktok_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();