import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    console.log(`TikTok send action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      case 'create_dm_campaign': {
        const { account_id, campaign_name, message_type, content, media_url, recipients } = body;
        const { data, error } = await supabase.from('tiktok_campaigns').insert({
          user_id: user.id,
          account_id,
          campaign_name,
          campaign_type: 'dm',
          message_type,
          content,
          media_url,
          recipients,
          total_recipients: recipients?.length || 0,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'create_comment_campaign': {
        const { account_id, campaign_name, content, video_urls, mention_users } = body;
        const { data, error } = await supabase.from('tiktok_campaigns').insert({
          user_id: user.id,
          account_id,
          campaign_name,
          campaign_type: 'comment',
          message_type: 'text',
          content,
          recipients: video_urls,
          total_recipients: video_urls?.length || 0,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_campaigns': {
        const { data, error } = await supabase.from('tiktok_campaigns')
          .select('*, tiktok_accounts(username)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, campaigns: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'update_campaign_status': {
        const { campaign_id, status, sent_count, failed_count } = body;
        const updateData: Record<string, unknown> = { status };
        if (sent_count !== undefined) updateData.sent_count = sent_count;
        if (failed_count !== undefined) updateData.failed_count = failed_count;
        if (status === 'running') updateData.started_at = new Date().toISOString();
        if (status === 'completed' || status === 'failed') updateData.completed_at = new Date().toISOString();

        const { data, error } = await supabase.from('tiktok_campaigns')
          .update(updateData)
          .eq('id', campaign_id)
          .eq('user_id', user.id)
          .select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: unknown) {
    console.error('Error in tiktok-send:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
