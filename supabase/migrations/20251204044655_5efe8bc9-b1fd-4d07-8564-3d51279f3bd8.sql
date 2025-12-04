-- Create whatsapp_accounts table
CREATE TABLE public.whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  account_name TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  session_data TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'rate_limited')),
  messages_sent_today INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp accounts"
ON public.whatsapp_accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp accounts"
ON public.whatsapp_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp accounts"
ON public.whatsapp_accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whatsapp accounts"
ON public.whatsapp_accounts FOR DELETE USING (auth.uid() = user_id);

-- Create whatsapp_campaigns table
CREATE TABLE public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'file', 'link')),
  content TEXT,
  media_url TEXT,
  recipients TEXT[],
  sending_mode TEXT NOT NULL DEFAULT '10_per_min' CHECK (sending_mode IN ('10_per_min', '20_per_min', '35_per_min', 'group_add')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp campaigns"
ON public.whatsapp_campaigns FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp campaigns"
ON public.whatsapp_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp campaigns"
ON public.whatsapp_campaigns FOR UPDATE USING (auth.uid() = user_id);

-- Create whatsapp_extractions table
CREATE TABLE public.whatsapp_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL CHECK (extraction_type IN ('group_link', 'group_name', 'archived_chats', 'contacts')),
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.whatsapp_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp extractions"
ON public.whatsapp_extractions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp extractions"
ON public.whatsapp_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create whatsapp_groups table
CREATE TABLE public.whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  group_name TEXT NOT NULL,
  group_id TEXT,
  invite_link TEXT,
  member_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp groups"
ON public.whatsapp_groups FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp groups"
ON public.whatsapp_groups FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp groups"
ON public.whatsapp_groups FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whatsapp groups"
ON public.whatsapp_groups FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();