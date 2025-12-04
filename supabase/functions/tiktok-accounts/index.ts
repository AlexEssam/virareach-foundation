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
    console.log(`TikTok accounts action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      case 'add_account': {
        const { username, account_name, session_data, proxy_host, proxy_port, proxy_username, proxy_password } = body;
        const { data, error } = await supabase.from('tiktok_accounts').insert({
          user_id: user.id,
          username,
          account_name,
          session_data,
          proxy_host,
          proxy_port,
          proxy_username,
          proxy_password,
          status: 'active'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, account: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_accounts': {
        const { data, error } = await supabase.from('tiktok_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, accounts: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'update_account': {
        const { account_id, ...updateFields } = body;
        const { data, error } = await supabase.from('tiktok_accounts')
          .update(updateFields)
          .eq('id', account_id)
          .eq('user_id', user.id)
          .select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, account: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'delete_account': {
        const { account_id } = body;
        const { error } = await supabase.from('tiktok_accounts')
          .delete()
          .eq('id', account_id)
          .eq('user_id', user.id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: unknown) {
    console.error('Error in tiktok-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
