import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MentionCampaign {
  id?: string;
  user_id: string;
  campaign_name: string;
  campaign_type: string;
  account_ids: string[];
  video_urls?: string[];
  video_url?: string;
  target_usernames: string[];
  mention_text?: string;
  mentions_per_comment: number;
  total_mentions: number;
  completed_mentions: number;
  failed_mentions: number;
  status: string;
  settings: {
    randomize_order: boolean;
    delay_min: number;
    delay_max: number;
  };
  created_at?: string;
}

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
    console.log(`TikTok mentions action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      // ============ CREATE TARGETED CAMPAIGN ============
      case 'create_targeted_campaign': {
        const { 
          campaign_name, 
          account_ids, 
          video_urls, 
          target_usernames, 
          mention_text,
          mentions_per_comment = 3,
          randomize_order = true,
          delay_min = 30,
          delay_max = 90
        } = body;

        const cleanUsernames = target_usernames.map((u: string) => u.replace('@', '').trim()).filter(Boolean);
        const totalMentions = Math.ceil(cleanUsernames.length / mentions_per_comment) * video_urls.length;

        // Store campaign in tiktok_campaigns table with campaign_type 'mention'
        const { data, error } = await supabase.from('tiktok_campaigns').insert({
          user_id: user.id,
          account_id: account_ids[0], // Primary account
          campaign_name,
          campaign_type: 'mention_targeted',
          message_type: 'comment',
          content: mention_text || '',
          recipients: cleanUsernames,
          total_recipients: totalMentions,
          sent_count: 0,
          failed_count: 0,
          status: 'pending'
        }).select().single();

        if (error) throw error;

        console.log(`Created targeted mention campaign: ${campaign_name} with ${cleanUsernames.length} targets on ${video_urls.length} videos`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          campaign: {
            ...data,
            total_mentions: totalMentions,
            video_count: video_urls.length,
            accounts_used: account_ids.length
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ CREATE CUSTOM LIST CAMPAIGN ============
      case 'create_custom_list_campaign': {
        const { 
          campaign_name, 
          account_ids, 
          video_url, 
          custom_usernames, 
          mention_text,
          mentions_per_comment = 3,
          randomize_order = true,
          delay_min = 30,
          delay_max = 90
        } = body;

        const cleanUsernames = custom_usernames.map((u: string) => u.replace('@', '').trim()).filter(Boolean);
        const totalMentions = Math.ceil(cleanUsernames.length / mentions_per_comment);

        const { data, error } = await supabase.from('tiktok_campaigns').insert({
          user_id: user.id,
          account_id: account_ids[0],
          campaign_name,
          campaign_type: 'mention_custom_list',
          message_type: 'comment',
          content: mention_text || '',
          media_url: video_url,
          recipients: cleanUsernames,
          total_recipients: totalMentions,
          sent_count: 0,
          failed_count: 0,
          status: 'pending'
        }).select().single();

        if (error) throw error;

        console.log(`Created custom list mention campaign: ${campaign_name} with ${cleanUsernames.length} users`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          campaign: {
            ...data,
            total_mentions: totalMentions,
            usernames_count: cleanUsernames.length
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ START CAMPAIGN ============
      case 'start_campaign': {
        const { campaign_id } = body;
        
        const { data: campaign, error: fetchError } = await supabase
          .from('tiktok_campaigns')
          .select('*')
          .eq('id', campaign_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;
        if (!campaign) throw new Error('Campaign not found');

        const { error } = await supabase
          .from('tiktok_campaigns')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', campaign_id);

        if (error) throw error;

        console.log(`Started mention campaign: ${campaign_id}`);
        
        return new Response(JSON.stringify({ success: true, message: 'Campaign started' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ PAUSE/STOP CAMPAIGN ============
      case 'pause_campaign': {
        const { campaign_id } = body;
        
        const { error } = await supabase
          .from('tiktok_campaigns')
          .update({ status: 'paused' })
          .eq('id', campaign_id)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log(`Paused mention campaign: ${campaign_id}`);
        
        return new Response(JSON.stringify({ success: true, message: 'Campaign paused' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'stop_campaign': {
        const { campaign_id } = body;
        
        const { error } = await supabase
          .from('tiktok_campaigns')
          .update({ status: 'stopped', completed_at: new Date().toISOString() })
          .eq('id', campaign_id)
          .eq('user_id', user.id);

        if (error) throw error;

        console.log(`Stopped mention campaign: ${campaign_id}`);
        
        return new Response(JSON.stringify({ success: true, message: 'Campaign stopped' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ GET CAMPAIGNS ============
      case 'get_campaigns': {
        const { data, error } = await supabase
          .from('tiktok_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .in('campaign_type', ['mention_targeted', 'mention_custom_list'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Transform to match expected format
        const campaigns = data?.map(c => ({
          id: c.id,
          campaign_name: c.campaign_name,
          campaign_type: c.campaign_type.replace('mention_', ''),
          total_mentions: c.total_recipients,
          completed_mentions: c.sent_count,
          failed_mentions: c.failed_count,
          status: c.status,
          created_at: c.created_at
        }));

        return new Response(JSON.stringify({ success: true, campaigns }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ GET CAMPAIGN DETAILS ============
      case 'get_campaign_details': {
        const { campaign_id } = body;
        
        const { data, error } = await supabase
          .from('tiktok_campaigns')
          .select('*')
          .eq('id', campaign_id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: unknown) {
    console.error('Error in tiktok-mentions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
