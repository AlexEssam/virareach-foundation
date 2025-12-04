-- Create linkedin_accounts table
CREATE TABLE public.linkedin_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  account_name TEXT,
  session_data TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  connections_sent_today INTEGER DEFAULT 0,
  messages_sent_today INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create linkedin_extractions table
CREATE TABLE public.linkedin_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  source TEXT,
  filters JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create linkedin_campaigns table
CREATE TABLE public.linkedin_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'message',
  content TEXT,
  recipients TEXT[],
  sending_mode TEXT NOT NULL DEFAULT '10_per_day',
  status TEXT NOT NULL DEFAULT 'pending',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create linkedin_connections table
CREATE TABLE public.linkedin_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.linkedin_accounts(id) ON DELETE SET NULL,
  target_profile_url TEXT NOT NULL,
  target_name TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for linkedin_accounts
CREATE POLICY "Users can view their own linkedin accounts" ON public.linkedin_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own linkedin accounts" ON public.linkedin_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own linkedin accounts" ON public.linkedin_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own linkedin accounts" ON public.linkedin_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for linkedin_extractions
CREATE POLICY "Users can view their own linkedin extractions" ON public.linkedin_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own linkedin extractions" ON public.linkedin_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for linkedin_campaigns
CREATE POLICY "Users can view their own linkedin campaigns" ON public.linkedin_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own linkedin campaigns" ON public.linkedin_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own linkedin campaigns" ON public.linkedin_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for linkedin_connections
CREATE POLICY "Users can view their own linkedin connections" ON public.linkedin_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own linkedin connections" ON public.linkedin_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own linkedin connections" ON public.linkedin_connections FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at on linkedin_accounts
CREATE TRIGGER update_linkedin_accounts_updated_at
  BEFORE UPDATE ON public.linkedin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();