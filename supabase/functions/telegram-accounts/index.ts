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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();
    console.log(`Telegram accounts action: ${action}`, params);

    switch (action) {
      case 'list': {
        const { data, error } = await supabaseClient
          .from('telegram_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ accounts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add': {
        const { phone_number, account_name, api_id, api_hash, proxy_host, proxy_port, proxy_username, proxy_password } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_accounts')
          .insert({
            user_id: user.id,
            phone_number,
            account_name,
            api_id,
            api_hash,
            proxy_host,
            proxy_port,
            proxy_username,
            proxy_password,
            status: 'pending_verification'
          })
          .select()
          .single();

        if (error) throw error;
        
        console.log(`Added Telegram account: ${phone_number}`);
        return new Response(JSON.stringify({ account: data, message: 'Account added, verification required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify': {
        const { account_id, verification_code } = params;
        
        // Simulate verification process
        console.log(`Verifying account ${account_id} with code ${verification_code}`);
        
        const { data, error } = await supabaseClient
          .from('telegram_accounts')
          .update({ status: 'active' })
          .eq('id', account_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ account: data, message: 'Account verified successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { account_id } = params;
        
        const { error } = await supabaseClient
          .from('telegram_accounts')
          .delete()
          .eq('id', account_id)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_status': {
        const { account_id, status } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_accounts')
          .update({ status })
          .eq('id', account_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('Telegram accounts error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
