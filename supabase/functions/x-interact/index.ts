import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limits for anti-ban protection
const DAILY_LIKE_LIMIT = 200
const DAILY_FOLLOW_LIMIT = 100
const DAILY_RETWEET_LIMIT = 100
const INTERACTION_DELAY = 15000 // 15 seconds between actions

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
    console.log(`X interact action: ${action}`, params)

    switch (action) {
      case 'auto_like': {
        const { account_id, tweet_ids } = params
        
        const { data: account } = await supabase
          .from('x_accounts')
          .select('daily_like_count')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single()

        if (account && account.daily_like_count >= DAILY_LIKE_LIMIT) {
          return new Response(JSON.stringify({ 
            error: 'Daily like limit reached',
            limit: DAILY_LIKE_LIMIT 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const interactions = tweet_ids.map((tweet_id: string) => ({
          user_id: user.id,
          account_id,
          interaction_type: 'like',
          target_tweet_id: tweet_id,
          status: 'pending'
        }))

        const { data, error } = await supabase
          .from('x_interactions')
          .insert(interactions)
          .select()

        if (error) throw error

        await supabase
          .from('x_accounts')
          .update({ 
            daily_like_count: (account?.daily_like_count || 0) + tweet_ids.length,
            last_action_at: new Date().toISOString()
          })
          .eq('id', account_id)

        return new Response(JSON.stringify({ 
          queued: data,
          message: `Queued ${tweet_ids.length} like actions`,
          delay_between: INTERACTION_DELAY
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'auto_comment': {
        const { account_id, targets } = params
        
        const interactions = targets.map((target: any) => ({
          user_id: user.id,
          account_id,
          interaction_type: 'comment',
          target_tweet_id: target.tweet_id,
          status: 'pending'
        }))

        const { data, error } = await supabase
          .from('x_interactions')
          .insert(interactions)
          .select()

        if (error) throw error

        return new Response(JSON.stringify({ 
          queued: data,
          message: `Queued ${targets.length} comment actions`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'auto_retweet': {
        const { account_id, tweet_ids } = params
        
        const interactions = tweet_ids.map((tweet_id: string) => ({
          user_id: user.id,
          account_id,
          interaction_type: 'retweet',
          target_tweet_id: tweet_id,
          status: 'pending'
        }))

        const { data, error } = await supabase
          .from('x_interactions')
          .insert(interactions)
          .select()

        if (error) throw error

        return new Response(JSON.stringify({ 
          queued: data,
          message: `Queued ${tweet_ids.length} retweet actions`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'auto_follow': {
        const { account_id, target_usernames } = params
        
        const { data: account } = await supabase
          .from('x_accounts')
          .select('daily_follow_count')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single()

        if (account && account.daily_follow_count >= DAILY_FOLLOW_LIMIT) {
          return new Response(JSON.stringify({ 
            error: 'Daily follow limit reached',
            limit: DAILY_FOLLOW_LIMIT 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const interactions = target_usernames.map((username: string) => ({
          user_id: user.id,
          account_id,
          interaction_type: 'follow',
          target_username: username,
          status: 'pending'
        }))

        const { data, error } = await supabase
          .from('x_interactions')
          .insert(interactions)
          .select()

        if (error) throw error

        await supabase
          .from('x_accounts')
          .update({ 
            daily_follow_count: (account?.daily_follow_count || 0) + target_usernames.length,
            last_action_at: new Date().toISOString()
          })
          .eq('id', account_id)

        return new Response(JSON.stringify({ 
          queued: data,
          message: `Queued ${target_usernames.length} follow actions`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list_interactions': {
        const { status, interaction_type } = params
        
        let query = supabase
          .from('x_interactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (status) query = query.eq('status', status)
        if (interaction_type) query = query.eq('interaction_type', interaction_type)

        const { data, error } = await query

        if (error) throw error
        return new Response(JSON.stringify({ interactions: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_limits': {
        const { account_id } = params
        
        const { data: account } = await supabase
          .from('x_accounts')
          .select('daily_like_count, daily_follow_count, daily_tweet_count')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single()

        return new Response(JSON.stringify({ 
          limits: {
            daily_like: { used: account?.daily_like_count || 0, max: DAILY_LIKE_LIMIT },
            daily_follow: { used: account?.daily_follow_count || 0, max: DAILY_FOLLOW_LIMIT },
            daily_retweet: { max: DAILY_RETWEET_LIMIT },
            delay_between: INTERACTION_DELAY
          }
        }), {
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
    console.error('X interact error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
