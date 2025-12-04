import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Anti-ban timing controls (delays in ms)
const FOLLOW_DELAY = 30000 // 30 seconds between follows
const UNFOLLOW_DELAY = 45000 // 45 seconds between unfollows
const DAILY_FOLLOW_LIMIT = 100
const DAILY_UNFOLLOW_LIMIT = 100
const HOURLY_FOLLOW_LIMIT = 20

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
    console.log(`Instagram follow action: ${action}`, params)

    switch (action) {
      case 'follow': {
        const { account_id, target_usernames } = params
        
        // Check daily limits
        const { data: account } = await supabase
          .from('instagram_accounts')
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

        // Queue follow actions
        const followActions = target_usernames.map((username: string) => ({
          user_id: user.id,
          account_id,
          target_username: username,
          action_type: 'follow',
          status: 'pending'
        }))

        const { data, error } = await supabase
          .from('instagram_follows')
          .insert(followActions)
          .select()

        if (error) throw error

        // Update daily count
        await supabase
          .from('instagram_accounts')
          .update({ 
            daily_follow_count: (account?.daily_follow_count || 0) + target_usernames.length,
            last_action_at: new Date().toISOString()
          })
          .eq('id', account_id)
          .eq('user_id', user.id)

        return new Response(JSON.stringify({ 
          queued: data,
          message: `Queued ${target_usernames.length} follow actions`,
          delay_between: FOLLOW_DELAY
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'unfollow': {
        const { account_id, target_usernames } = params
        
        const { data: account } = await supabase
          .from('instagram_accounts')
          .select('daily_unfollow_count')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single()

        if (account && account.daily_unfollow_count >= DAILY_UNFOLLOW_LIMIT) {
          return new Response(JSON.stringify({ 
            error: 'Daily unfollow limit reached',
            limit: DAILY_UNFOLLOW_LIMIT 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const unfollowActions = target_usernames.map((username: string) => ({
          user_id: user.id,
          account_id,
          target_username: username,
          action_type: 'unfollow',
          status: 'pending'
        }))

        const { data, error } = await supabase
          .from('instagram_follows')
          .insert(unfollowActions)
          .select()

        if (error) throw error

        await supabase
          .from('instagram_accounts')
          .update({ 
            daily_unfollow_count: (account?.daily_unfollow_count || 0) + target_usernames.length,
            last_action_at: new Date().toISOString()
          })
          .eq('id', account_id)
          .eq('user_id', user.id)

        return new Response(JSON.stringify({ 
          queued: data,
          message: `Queued ${target_usernames.length} unfollow actions`,
          delay_between: UNFOLLOW_DELAY
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_non_followers': {
        // Get users you follow but don't follow back
        const { account_id, source_username } = params

        // Simulate getting non-followers (in production would compare following vs followers)
        const mockNonFollowers = Array.from({ length: 30 }, (_, i) => ({
          username: `non_follower_${i + 1}`,
          followed_at: new Date(Date.now() - i * 86400000 * 7).toISOString()
        }))

        return new Response(JSON.stringify({ non_followers: mockNonFollowers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list_actions': {
        const { status, action_type } = params
        
        let query = supabase
          .from('instagram_follows')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (status) query = query.eq('status', status)
        if (action_type) query = query.eq('action_type', action_type)

        const { data, error } = await query

        if (error) throw error
        return new Response(JSON.stringify({ actions: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_limits': {
        const { account_id } = params
        
        const { data: account } = await supabase
          .from('instagram_accounts')
          .select('daily_follow_count, daily_unfollow_count, daily_dm_count')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single()

        return new Response(JSON.stringify({ 
          limits: {
            daily_follow: { used: account?.daily_follow_count || 0, max: DAILY_FOLLOW_LIMIT },
            daily_unfollow: { used: account?.daily_unfollow_count || 0, max: DAILY_UNFOLLOW_LIMIT },
            hourly_follow: { max: HOURLY_FOLLOW_LIMIT },
            delays: { follow: FOLLOW_DELAY, unfollow: UNFOLLOW_DELAY }
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
    console.error('Instagram follow error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
