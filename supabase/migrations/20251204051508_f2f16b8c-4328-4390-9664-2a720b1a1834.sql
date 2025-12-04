-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'html',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  campaign_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'html',
  template_id UUID REFERENCES public.email_templates(id),
  recipients JSONB DEFAULT '[]'::jsonb,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  anti_spam_settings JSONB DEFAULT '{"delay_between_emails": 5, "batch_size": 50, "daily_limit": 500}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email templates"
ON public.email_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email templates"
ON public.email_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates"
ON public.email_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates"
ON public.email_templates FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on email_campaigns
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email campaigns"
ON public.email_campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email campaigns"
ON public.email_campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email campaigns"
ON public.email_campaigns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email campaigns"
ON public.email_campaigns FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();