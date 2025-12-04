-- Create telegram_accounts table
CREATE TABLE public.telegram_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  account_name TEXT,
  session_data TEXT,
  api_id TEXT,
  api_hash TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  messages_sent_today INTEGER DEFAULT 0,
  groups_joined_today INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telegram_extractions table
CREATE TABLE public.telegram_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  source TEXT,
  source_group_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create telegram_campaigns table
CREATE TABLE public.telegram_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.telegram_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  target_type TEXT NOT NULL DEFAULT 'phone',
  recipients TEXT[],
  sending_mode TEXT NOT NULL DEFAULT '10_per_min',
  status TEXT NOT NULL DEFAULT 'pending',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telegram_groups table
CREATE TABLE public.telegram_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.telegram_accounts(id) ON DELETE SET NULL,
  group_id TEXT,
  group_name TEXT NOT NULL,
  group_type TEXT DEFAULT 'group',
  invite_link TEXT,
  member_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for telegram_accounts
CREATE POLICY "Users can view their own telegram accounts" ON public.telegram_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own telegram accounts" ON public.telegram_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own telegram accounts" ON public.telegram_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own telegram accounts" ON public.telegram_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for telegram_extractions
CREATE POLICY "Users can view their own telegram extractions" ON public.telegram_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own telegram extractions" ON public.telegram_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for telegram_campaigns
CREATE POLICY "Users can view their own telegram campaigns" ON public.telegram_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own telegram campaigns" ON public.telegram_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own telegram campaigns" ON public.telegram_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for telegram_groups
CREATE POLICY "Users can view their own telegram groups" ON public.telegram_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own telegram groups" ON public.telegram_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own telegram groups" ON public.telegram_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own telegram groups" ON public.telegram_groups FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on telegram_accounts
CREATE TRIGGER update_telegram_accounts_updated_at
  BEFORE UPDATE ON public.telegram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();