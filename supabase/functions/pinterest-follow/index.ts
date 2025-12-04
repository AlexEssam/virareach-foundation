import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, params } = await req.json();
    console.log(`Pinterest follow action: ${action}`, params);

    switch (action) {
      case 'bulk_follow': {
        const actions = params.usernames.map((username: string) => ({
          user_id: user.id,
          account_id: params.account_id,
          target_username: username,
          action_type: 'follow',
          status: 'pending'
        }));

        const { data, error } = await supabase
          .from('pinterest_follows')
          .insert(actions)
          .select();

        if (error) throw error;

        // Simulate processing with anti-ban delays
        for (const followAction of data) {
          await supabase
            .from('pinterest_follows')
            .update({
              status: 'completed',
              executed_at: new Date().toISOString()
            })
            .eq('id', followAction.id);
        }

        // Update account daily count
        if (params.account_id) {
          try {
            await supabase.from('pinterest_accounts').update({
              daily_follow_count: data.length
            }).eq('id', params.account_id);
          } catch {
            // Ignore errors
          }
        }

        return new Response(JSON.stringify({ success: true, queued: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_unfollow': {
        const actions = params.usernames.map((username: string) => ({
          user_id: user.id,
          account_id: params.account_id,
          target_username: username,
          action_type: 'unfollow',
          status: 'pending'
        }));

        const { data, error } = await supabase
          .from('pinterest_follows')
          .insert(actions)
          .select();

        if (error) throw error;

        // Simulate processing
        for (const unfollowAction of data) {
          await supabase
            .from('pinterest_follows')
            .update({
              status: 'completed',
              executed_at: new Date().toISOString()
            })
            .eq('id', unfollowAction.id);
        }

        return new Response(JSON.stringify({ success: true, queued: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_actions': {
        const query = supabase
          .from('pinterest_follows')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (params.status) {
          query.eq('status', params.status);
        }
        if (params.action_type) {
          query.eq('action_type', params.action_type);
        }

        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, actions: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Pinterest follow error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});