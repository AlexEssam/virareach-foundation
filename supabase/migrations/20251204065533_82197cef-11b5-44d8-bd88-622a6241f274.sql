-- Create snapchat_accounts table
CREATE TABLE public.snapchat_accounts (
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
  friends_count INTEGER DEFAULT 0,
  daily_message_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create snapchat_extractions table
CREATE TABLE public.snapchat_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  niche TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create snapchat_campaigns table
CREATE TABLE public.snapchat_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.snapchat_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  whatsapp_link TEXT,
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

-- Create snapchat_messages table for detailed message tracking
CREATE TABLE public.snapchat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.snapchat_campaigns(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.snapchat_accounts(id) ON DELETE SET NULL,
  recipient_username TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.snapchat_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapchat_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapchat_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapchat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for snapchat_accounts
CREATE POLICY "Users can view their own snapchat accounts" ON public.snapchat_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snapchat accounts" ON public.snapchat_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own snapchat accounts" ON public.snapchat_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own snapchat accounts" ON public.snapchat_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for snapchat_extractions
CREATE POLICY "Users can view their own snapchat extractions" ON public.snapchat_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snapchat extractions" ON public.snapchat_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for snapchat_campaigns
CREATE POLICY "Users can view their own snapchat campaigns" ON public.snapchat_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snapchat campaigns" ON public.snapchat_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own snapchat campaigns" ON public.snapchat_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for snapchat_messages
CREATE POLICY "Users can view their own snapchat messages" ON public.snapchat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snapchat messages" ON public.snapchat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own snapchat messages" ON public.snapchat_messages FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_snapchat_accounts_updated_at BEFORE UPDATE ON public.snapchat_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();