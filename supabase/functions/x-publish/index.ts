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
    console.log(`X publish action: ${action}`, params)

    switch (action) {
      case 'create_tweet': {
        const { account_id, content, media_urls, scheduled_at } = params
        
        const { data, error } = await supabase
          .from('x_tweets')
          .insert({
            user_id: user.id,
            account_id,
            content,
            media_urls,
            scheduled_at,
            status: scheduled_at ? 'scheduled' : 'draft'
          })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ tweet: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'bulk_create': {
        const { account_id, tweets } = params
        
        const tweetRecords = tweets.map((tweet: any) => ({
          user_id: user.id,
          account_id,
          content: tweet.content,
          media_urls: tweet.media_urls,
          scheduled_at: tweet.scheduled_at,
          status: tweet.scheduled_at ? 'scheduled' : 'draft'
        }))

        const { data, error } = await supabase
          .from('x_tweets')
          .insert(tweetRecords)
          .select()

        if (error) throw error
        return new Response(JSON.stringify({ tweets: data, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'publish_now': {
        const { tweet_id } = params
        
        // In production, this would call X API to post the tweet
        const { data, error } = await supabase
          .from('x_tweets')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            tweet_id: `mock_${Date.now()}`
          })
          .eq('id', tweet_id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        // Update account tweet count
        if (data.account_id) {
          await supabase.rpc('increment_daily_tweet_count', { account_id: data.account_id })
        }

        return new Response(JSON.stringify({ tweet: data, message: 'Tweet published successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'delete_tweet': {
        const { tweet_id } = params
        
        const { error } = await supabase
          .from('x_tweets')
          .delete()
          .eq('id', tweet_id)
          .eq('user_id', user.id)

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list_tweets': {
        const { status } = params
        
        let query = supabase
          .from('x_tweets')
          .select('*, x_accounts(username)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)

        const { data, error } = await query

        if (error) throw error
        return new Response(JSON.stringify({ tweets: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list_accounts': {
        const { data, error } = await supabase
          .from('x_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        return new Response(JSON.stringify({ accounts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'add_account': {
        const { username, account_name, api_key, api_secret, access_token, access_token_secret, proxy_host, proxy_port, proxy_username, proxy_password } = params
        
        const { data, error } = await supabase
          .from('x_accounts')
          .insert({
            user_id: user.id,
            username,
            account_name,
            api_key,
            api_secret,
            access_token,
            access_token_secret,
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

      case 'delete_account': {
        const { id } = params
        
        const { error } = await supabase
          .from('x_accounts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
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
    console.error('X publish error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
