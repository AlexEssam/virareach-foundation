-- Create table for saved WhatsApp contacts
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  tags TEXT[],
  notes TEXT,
  last_messaged_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for auto-reply rules
CREATE TABLE public.whatsapp_auto_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'keyword', -- keyword, any_message, time_based
  trigger_keywords TEXT[],
  response_content TEXT NOT NULL,
  response_media_url TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for scheduled campaigns
CREATE TABLE public.whatsapp_scheduled (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  recipients TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sending_mode TEXT NOT NULL DEFAULT '10_per_min',
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, running, completed, cancelled
  executed_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for group discovery from social platforms
CREATE TABLE public.whatsapp_discovered_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL, -- facebook, telegram, twitter, instagram
  source_url TEXT,
  invite_link TEXT NOT NULL,
  group_name TEXT,
  description TEXT,
  member_estimate INTEGER,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'discovered', -- discovered, joined, failed, left
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all new tables
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_scheduled ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_discovered_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_contacts
CREATE POLICY "Users can view their own whatsapp contacts" 
ON public.whatsapp_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own whatsapp contacts" 
ON public.whatsapp_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whatsapp contacts" 
ON public.whatsapp_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own whatsapp contacts" 
ON public.whatsapp_contacts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for whatsapp_auto_replies
CREATE POLICY "Users can view their own whatsapp auto replies" 
ON public.whatsapp_auto_replies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own whatsapp auto replies" 
ON public.whatsapp_auto_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whatsapp auto replies" 
ON public.whatsapp_auto_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own whatsapp auto replies" 
ON public.whatsapp_auto_replies FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for whatsapp_scheduled
CREATE POLICY "Users can view their own whatsapp scheduled" 
ON public.whatsapp_scheduled FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own whatsapp scheduled" 
ON public.whatsapp_scheduled FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whatsapp scheduled" 
ON public.whatsapp_scheduled FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own whatsapp scheduled" 
ON public.whatsapp_scheduled FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for whatsapp_discovered_groups
CREATE POLICY "Users can view their own whatsapp discovered groups" 
ON public.whatsapp_discovered_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own whatsapp discovered groups" 
ON public.whatsapp_discovered_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whatsapp discovered groups" 
ON public.whatsapp_discovered_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own whatsapp discovered groups" 
ON public.whatsapp_discovered_groups FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_contacts_updated_at
BEFORE UPDATE ON public.whatsapp_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_auto_replies_updated_at
BEFORE UPDATE ON public.whatsapp_auto_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();