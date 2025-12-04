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
    console.log(`TikTok follow action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      case 'follow_user': {
        const { account_id, target_username } = body;
        const { data, error } = await supabase.from('tiktok_follows').insert({
          user_id: user.id,
          account_id,
          target_username,
          action_type: 'follow',
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, follow: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'unfollow_user': {
        const { account_id, target_username } = body;
        const { data, error } = await supabase.from('tiktok_follows').insert({
          user_id: user.id,
          account_id,
          target_username,
          action_type: 'unfollow',
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, follow: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'bulk_follow': {
        const { account_id, usernames } = body;
        const records = usernames.map((username: string) => ({
          user_id: user.id,
          account_id,
          target_username: username,
          action_type: 'follow',
          status: 'pending'
        }));
        const { data, error } = await supabase.from('tiktok_follows').insert(records).select();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, follows: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'bulk_unfollow': {
        const { account_id, usernames } = body;
        const records = usernames.map((username: string) => ({
          user_id: user.id,
          account_id,
          target_username: username,
          action_type: 'unfollow',
          status: 'pending'
        }));
        const { data, error } = await supabase.from('tiktok_follows').insert(records).select();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, follows: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_follow_actions': {
        const { data, error } = await supabase.from('tiktok_follows')
          .select('*, tiktok_accounts(username)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, actions: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: unknown) {
    console.error('Error in tiktok-follow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
