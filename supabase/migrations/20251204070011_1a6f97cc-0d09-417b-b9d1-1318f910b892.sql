-- Create vk_accounts table
CREATE TABLE public.vk_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vk_id TEXT NOT NULL,
  username TEXT,
  account_name TEXT,
  access_token TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  friends_count INTEGER DEFAULT 0,
  daily_message_count INTEGER DEFAULT 0,
  daily_friend_request_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vk_extractions table
CREATE TABLE public.vk_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  interests TEXT,
  source_user_id TEXT,
  community_id TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vk_communities table
CREATE TABLE public.vk_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.vk_accounts(id) ON DELETE SET NULL,
  community_vk_id TEXT NOT NULL,
  community_name TEXT NOT NULL,
  community_type TEXT,
  member_count INTEGER DEFAULT 0,
  description TEXT,
  is_joined BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'discovered',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vk_campaigns table
CREATE TABLE public.vk_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.vk_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'message',
  content TEXT,
  recipients JSONB,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  min_interval INTEGER DEFAULT 30,
  max_interval INTEGER DEFAULT 120,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vk_friend_requests table
CREATE TABLE public.vk_friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.vk_accounts(id) ON DELETE SET NULL,
  target_vk_id TEXT NOT NULL,
  target_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vk_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vk_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vk_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vk_friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for vk_accounts
CREATE POLICY "Users can view their own vk accounts" ON public.vk_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vk accounts" ON public.vk_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vk accounts" ON public.vk_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vk accounts" ON public.vk_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for vk_extractions
CREATE POLICY "Users can view their own vk extractions" ON public.vk_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vk extractions" ON public.vk_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for vk_communities
CREATE POLICY "Users can view their own vk communities" ON public.vk_communities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vk communities" ON public.vk_communities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vk communities" ON public.vk_communities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vk communities" ON public.vk_communities FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for vk_campaigns
CREATE POLICY "Users can view their own vk campaigns" ON public.vk_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vk campaigns" ON public.vk_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vk campaigns" ON public.vk_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for vk_friend_requests
CREATE POLICY "Users can view their own vk friend requests" ON public.vk_friend_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vk friend requests" ON public.vk_friend_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vk friend requests" ON public.vk_friend_requests FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_vk_accounts_updated_at BEFORE UPDATE ON public.vk_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();