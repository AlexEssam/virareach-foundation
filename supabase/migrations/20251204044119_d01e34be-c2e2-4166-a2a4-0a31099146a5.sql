-- Create facebook_accounts table
CREATE TABLE public.facebook_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_email TEXT,
  proxy_host TEXT,
  proxy_port INTEGER,
  proxy_username TEXT,
  proxy_password TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  cookies TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facebook_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own facebook accounts"
ON public.facebook_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facebook accounts"
ON public.facebook_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facebook accounts"
ON public.facebook_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facebook accounts"
ON public.facebook_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Create facebook_extractions table for storing extraction jobs
CREATE TABLE public.facebook_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL CHECK (extraction_type IN ('likers', 'commenters', 'sharers', 'group_members', 'page_fans', 'active_friends', 'page_messagers')),
  source_url TEXT,
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.facebook_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extractions"
ON public.facebook_extractions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions"
ON public.facebook_extractions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create facebook_publications table
CREATE TABLE public.facebook_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.facebook_accounts(id) ON DELETE SET NULL,
  publication_type TEXT NOT NULL CHECK (publication_type IN ('group_post', 'page_wall', 'public_page', 'share_to_groups')),
  content TEXT,
  target_ids TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facebook_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publications"
ON public.facebook_publications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own publications"
ON public.facebook_publications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_facebook_accounts_updated_at
  BEFORE UPDATE ON public.facebook_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();