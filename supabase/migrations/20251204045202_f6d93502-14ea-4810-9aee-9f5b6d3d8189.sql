-- Create instagram_accounts table
CREATE TABLE public.instagram_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  account_name TEXT,
  session_data TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  daily_follow_count INTEGER DEFAULT 0,
  daily_unfollow_count INTEGER DEFAULT 0,
  daily_dm_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instagram_extractions table
CREATE TABLE public.instagram_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  source TEXT,
  source_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  results JSONB,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create instagram_campaigns table
CREATE TABLE public.instagram_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE SET NULL,
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

-- Create instagram_follows table
CREATE TABLE public.instagram_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE SET NULL,
  target_username TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for instagram_accounts
CREATE POLICY "Users can view their own instagram accounts" ON public.instagram_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own instagram accounts" ON public.instagram_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own instagram accounts" ON public.instagram_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own instagram accounts" ON public.instagram_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for instagram_extractions
CREATE POLICY "Users can view their own instagram extractions" ON public.instagram_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own instagram extractions" ON public.instagram_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for instagram_campaigns
CREATE POLICY "Users can view their own instagram campaigns" ON public.instagram_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own instagram campaigns" ON public.instagram_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own instagram campaigns" ON public.instagram_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for instagram_follows
CREATE POLICY "Users can view their own instagram follows" ON public.instagram_follows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own instagram follows" ON public.instagram_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own instagram follows" ON public.instagram_follows FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_instagram_accounts_updated_at BEFORE UPDATE ON public.instagram_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();