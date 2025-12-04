import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, ...params } = await req.json()
    console.log(`Instagram accounts action: ${action}`, params)

    switch (action) {
      case 'list': {
        const { data, error } = await supabase
          .from('instagram_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        return new Response(JSON.stringify({ accounts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'add': {
        const { 
          username, 
          account_name, 
          account_email,
          account_password,
          session_data, 
          profile_path, 
          proxy_host, 
          proxy_port, 
          proxy_username, 
          proxy_password 
        } = params
        
        const { data, error } = await supabase
          .from('instagram_accounts')
          .insert({
            user_id: user.id,
            username,
            account_name,
            account_email,
            account_password,
            session_data,
            profile_path,
            proxy_host,
            proxy_port,
            proxy_username,
            proxy_password,
            status: 'active'
          })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'update': {
        const { id, ...updateData } = params
        
        const { data, error } = await supabase
          .from('instagram_accounts')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'delete': {
        const { id } = params
        
        const { error } = await supabase
          .from('instagram_accounts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'reset_daily_counts': {
        const { id } = params
        
        const { data, error } = await supabase
          .from('instagram_accounts')
          .update({
            daily_follow_count: 0,
            daily_unfollow_count: 0,
            daily_dm_count: 0
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error: any) {
    console.error('Instagram accounts error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
