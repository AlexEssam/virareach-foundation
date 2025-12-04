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
    console.log(`Reddit accounts action: ${action}`, params);

    switch (action) {
      case 'add_account': {
        const { data, error } = await supabase
          .from('reddit_accounts')
          .insert({
            user_id: user.id,
            username: params.username,
            account_name: params.account_name,
            session_data: params.session_data,
            proxy_host: params.proxy_host,
            proxy_port: params.proxy_port,
            proxy_username: params.proxy_username,
            proxy_password: params.proxy_password,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_accounts': {
        const { data, error } = await supabase
          .from('reddit_accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, accounts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_account': {
        const { error } = await supabase
          .from('reddit_accounts')
          .delete()
          .eq('id', params.account_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
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
    console.error('Reddit accounts error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});