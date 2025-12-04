-- Create table for Facebook messaging campaigns
CREATE TABLE public.facebook_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.facebook_accounts(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'dm', -- dm, group_chat, inbox_automation
  target_type TEXT NOT NULL DEFAULT 'friends', -- friends, customers, group_members
  content TEXT,
  media_urls TEXT[],
  recipients TEXT[],
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Facebook social automation
CREATE TABLE public.facebook_social_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.facebook_accounts(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- friend_request, like_page, join_group, invite_to_page, invite_to_group, comment, delete_friends, delete_posts, mention_in_post
  target_id TEXT,
  target_url TEXT,
  target_name TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Facebook groups (joined groups)
CREATE TABLE public.facebook_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.facebook_accounts(id) ON DELETE SET NULL,
  group_id TEXT,
  group_name TEXT NOT NULL,
  group_url TEXT,
  member_count INTEGER DEFAULT 0,
  can_post BOOLEAN DEFAULT false,
  has_rules BOOLEAN DEFAULT false,
  post_restrictions TEXT,
  interests TEXT[],
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.facebook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_social_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for facebook_messages
CREATE POLICY "Users can view their own facebook messages" 
ON public.facebook_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facebook messages" 
ON public.facebook_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facebook messages" 
ON public.facebook_messages FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facebook messages" 
ON public.facebook_messages FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for facebook_social_actions
CREATE POLICY "Users can view their own facebook social actions" 
ON public.facebook_social_actions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facebook social actions" 
ON public.facebook_social_actions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facebook social actions" 
ON public.facebook_social_actions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facebook social actions" 
ON public.facebook_social_actions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for facebook_groups
CREATE POLICY "Users can view their own facebook groups" 
ON public.facebook_groups FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facebook groups" 
ON public.facebook_groups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facebook groups" 
ON public.facebook_groups FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facebook groups" 
ON public.facebook_groups FOR DELETE 
USING (auth.uid() = user_id);