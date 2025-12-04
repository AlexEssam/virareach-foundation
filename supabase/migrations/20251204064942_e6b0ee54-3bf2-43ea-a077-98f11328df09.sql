-- Reddit Accounts Table
CREATE TABLE public.reddit_accounts (
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
  karma INTEGER DEFAULT 0,
  post_karma INTEGER DEFAULT 0,
  comment_karma INTEGER DEFAULT 0,
  daily_upvote_count INTEGER DEFAULT 0,
  daily_post_count INTEGER DEFAULT 0,
  daily_join_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reddit Communities Table
CREATE TABLE public.reddit_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL,
  subreddit_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  subscribers INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  category TEXT,
  is_nsfw BOOLEAN DEFAULT false,
  is_joined BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'discovered',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reddit Extractions Table
CREATE TABLE public.reddit_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  keyword TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_count INTEGER DEFAULT 0,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Reddit Posts Table
CREATE TABLE public.reddit_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL,
  subreddit TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'text',
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  flair TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reddit_post_id TEXT,
  upvotes INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reddit Upvotes Table
CREATE TABLE public.reddit_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL,
  target_post_url TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'upvote',
  status TEXT NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reddit Saved Posts Table
CREATE TABLE public.reddit_saved (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL,
  post_url TEXT NOT NULL,
  post_title TEXT,
  subreddit TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  saved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reddit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_saved ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reddit_accounts
CREATE POLICY "Users can view their own reddit accounts" ON public.reddit_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit accounts" ON public.reddit_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reddit accounts" ON public.reddit_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reddit accounts" ON public.reddit_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reddit_communities
CREATE POLICY "Users can view their own reddit communities" ON public.reddit_communities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit communities" ON public.reddit_communities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reddit communities" ON public.reddit_communities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reddit communities" ON public.reddit_communities FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reddit_extractions
CREATE POLICY "Users can view their own reddit extractions" ON public.reddit_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit extractions" ON public.reddit_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reddit_posts
CREATE POLICY "Users can view their own reddit posts" ON public.reddit_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit posts" ON public.reddit_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reddit posts" ON public.reddit_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reddit posts" ON public.reddit_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reddit_upvotes
CREATE POLICY "Users can view their own reddit upvotes" ON public.reddit_upvotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit upvotes" ON public.reddit_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reddit upvotes" ON public.reddit_upvotes FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for reddit_saved
CREATE POLICY "Users can view their own reddit saved" ON public.reddit_saved FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit saved" ON public.reddit_saved FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reddit saved" ON public.reddit_saved FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reddit_accounts_updated_at BEFORE UPDATE ON public.reddit_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();