-- Pinterest Accounts Table
CREATE TABLE public.pinterest_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  account_name TEXT,
  email TEXT,
  session_data TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  boards_count INTEGER DEFAULT 0,
  pins_count INTEGER DEFAULT 0,
  daily_follow_count INTEGER DEFAULT 0,
  daily_unfollow_count INTEGER DEFAULT 0,
  daily_dm_count INTEGER DEFAULT 0,
  daily_pin_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pinterest Extractions Table
CREATE TABLE public.pinterest_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  niche TEXT,
  board_url TEXT,
  source_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  analytics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Pinterest Boards Table
CREATE TABLE public.pinterest_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.pinterest_accounts(id) ON DELETE SET NULL,
  board_id TEXT,
  board_name TEXT NOT NULL,
  board_url TEXT,
  description TEXT,
  pins_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  category TEXT,
  is_collaborative BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pinterest Campaigns (Messaging)
CREATE TABLE public.pinterest_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.pinterest_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'dm',
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  recipients TEXT[],
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

-- Pinterest Follows Table
CREATE TABLE public.pinterest_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.pinterest_accounts(id) ON DELETE SET NULL,
  target_username TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pinterest Posts (Auto-posting/reposting)
CREATE TABLE public.pinterest_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.pinterest_accounts(id) ON DELETE SET NULL,
  board_id UUID REFERENCES public.pinterest_boards(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL DEFAULT 'pin',
  title TEXT,
  description TEXT,
  image_url TEXT,
  destination_url TEXT,
  source_pin_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pinterest_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pinterest_accounts
CREATE POLICY "Users can view their own pinterest accounts" ON public.pinterest_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinterest accounts" ON public.pinterest_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pinterest accounts" ON public.pinterest_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pinterest accounts" ON public.pinterest_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pinterest_extractions
CREATE POLICY "Users can view their own pinterest extractions" ON public.pinterest_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinterest extractions" ON public.pinterest_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pinterest_boards
CREATE POLICY "Users can view their own pinterest boards" ON public.pinterest_boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinterest boards" ON public.pinterest_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pinterest boards" ON public.pinterest_boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pinterest boards" ON public.pinterest_boards FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pinterest_campaigns
CREATE POLICY "Users can view their own pinterest campaigns" ON public.pinterest_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinterest campaigns" ON public.pinterest_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pinterest campaigns" ON public.pinterest_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pinterest_follows
CREATE POLICY "Users can view their own pinterest follows" ON public.pinterest_follows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinterest follows" ON public.pinterest_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pinterest follows" ON public.pinterest_follows FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pinterest_posts
CREATE POLICY "Users can view their own pinterest posts" ON public.pinterest_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinterest posts" ON public.pinterest_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pinterest posts" ON public.pinterest_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pinterest posts" ON public.pinterest_posts FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_pinterest_accounts_updated_at BEFORE UPDATE ON public.pinterest_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();