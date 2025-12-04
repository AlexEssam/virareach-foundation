import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRecipient {
  email: string;
  name?: string;
  status?: 'pending' | 'sent' | 'failed';
  error?: string;
}

interface CreateCampaignRequest {
  action: 'create_campaign';
  campaign_name: string;
  subject: string;
  content: string;
  content_type: 'html' | 'text';
  recipients: EmailRecipient[];
  template_id?: string;
  anti_spam_settings?: {
    delay_between_emails: number;
    batch_size: number;
    daily_limit: number;
  };
}

interface CreateTemplateRequest {
  action: 'create_template';
  template_name: string;
  subject: string;
  content: string;
  content_type: 'html' | 'text';
}

interface UpdateTemplateRequest {
  action: 'update_template';
  template_id: string;
  template_name?: string;
  subject?: string;
  content?: string;
  content_type?: 'html' | 'text';
}

interface DeleteTemplateRequest {
  action: 'delete_template';
  template_id: string;
}

interface GetTemplatesRequest {
  action: 'get_templates';
}

interface GetCampaignsRequest {
  action: 'get_campaigns';
}

interface UpdateCampaignStatusRequest {
  action: 'update_campaign_status';
  campaign_id: string;
  status: string;
  sent_count?: number;
  failed_count?: number;
}

type RequestBody = 
  | CreateCampaignRequest 
  | CreateTemplateRequest 
  | UpdateTemplateRequest
  | DeleteTemplateRequest
  | GetTemplatesRequest 
  | GetCampaignsRequest
  | UpdateCampaignStatusRequest;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    console.log(`Email action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      case 'create_campaign': {
        const { campaign_name, subject, content, content_type, recipients, template_id, anti_spam_settings } = body;
        
        const recipientsWithStatus = recipients.map(r => ({
          ...r,
          status: 'pending' as const
        }));

        const { data, error } = await supabase
          .from('email_campaigns')
          .insert({
            user_id: user.id,
            campaign_name,
            subject,
            content,
            content_type,
            template_id,
            recipients: recipientsWithStatus,
            total_recipients: recipients.length,
            anti_spam_settings: anti_spam_settings || { delay_between_emails: 5, batch_size: 50, daily_limit: 500 }
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_template': {
        const { template_name, subject, content, content_type } = body;

        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            user_id: user.id,
            template_name,
            subject,
            content,
            content_type
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_template': {
        const { template_id, template_name, subject, content, content_type } = body;

        const updateData: Record<string, string> = {};
        if (template_name) updateData.template_name = template_name;
        if (subject) updateData.subject = subject;
        if (content) updateData.content = content;
        if (content_type) updateData.content_type = content_type;

        const { data, error } = await supabase
          .from('email_templates')
          .update(updateData)
          .eq('id', template_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_template': {
        const { template_id } = body;

        const { error } = await supabase
          .from('email_templates')
          .delete()
          .eq('id', template_id)
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_templates': {
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, templates: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_campaigns': {
        const { data, error } = await supabase
          .from('email_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, campaigns: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_campaign_status': {
        const { campaign_id, status, sent_count, failed_count } = body;

        const updateData: Record<string, unknown> = { status };
        if (sent_count !== undefined) updateData.sent_count = sent_count;
        if (failed_count !== undefined) updateData.failed_count = failed_count;
        if (status === 'running') updateData.started_at = new Date().toISOString();
        if (status === 'completed' || status === 'failed') updateData.completed_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('email_campaigns')
          .update(updateData)
          .eq('id', campaign_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in email-send function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
