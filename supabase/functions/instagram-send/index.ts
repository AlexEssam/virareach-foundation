import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_DM_LIMIT = 50
const DM_DELAY = 60000 // 1 minute between DMs

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
    console.log(`Instagram send action: ${action}`, params)

    switch (action) {
      case 'create_campaign': {
        const { 
          account_id, 
          campaign_name, 
          campaign_type, 
          message_type, 
          content, 
          media_url, 
          recipients 
        } = params

        // Check daily DM limit
        const { data: account } = await supabase
          .from('instagram_accounts')
          .select('daily_dm_count')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single()

        if (account && account.daily_dm_count >= DAILY_DM_LIMIT) {
          return new Response(JSON.stringify({ 
            error: 'Daily DM limit reached',
            limit: DAILY_DM_LIMIT 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data, error } = await supabase
          .from('instagram_campaigns')
          .insert({
            user_id: user.id,
            account_id,
            campaign_name,
            campaign_type,
            message_type,
            content,
            media_url,
            recipients,
            total_recipients: recipients?.length || 0,
            status: 'pending'
          })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ campaign: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'start_campaign': {
        const { campaign_id } = params
        
        const { data: campaign, error: fetchError } = await supabase
          .from('instagram_campaigns')
          .select('*')
          .eq('id', campaign_id)
          .eq('user_id', user.id)
          .single()

        if (fetchError || !campaign) {
          return new Response(JSON.stringify({ error: 'Campaign not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error } = await supabase
          .from('instagram_campaigns')
          .update({
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', campaign_id)
          .eq('user_id', user.id)

        if (error) throw error

        // Update account DM count
        await supabase
          .from('instagram_accounts')
          .update({ 
            daily_dm_count: campaign.total_recipients,
            last_action_at: new Date().toISOString()
          })
          .eq('id', campaign.account_id)
          .eq('user_id', user.id)

        return new Response(JSON.stringify({ 
          message: 'Campaign started',
          delay_between_messages: DM_DELAY
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'pause_campaign': {
        const { campaign_id } = params
        
        const { error } = await supabase
          .from('instagram_campaigns')
          .update({ status: 'paused' })
          .eq('id', campaign_id)
          .eq('user_id', user.id)

        if (error) throw error
        return new Response(JSON.stringify({ message: 'Campaign paused' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'mention_in_comment': {
        const { account_id, post_url, usernames, comment_template } = params
        
        // Create a campaign for comment mentions
        const { data, error } = await supabase
          .from('instagram_campaigns')
          .insert({
            user_id: user.id,
            account_id,
            campaign_name: `Comment Mention - ${new Date().toISOString()}`,
            campaign_type: 'comment_mention',
            message_type: 'text',
            content: comment_template,
            recipients: usernames,
            total_recipients: usernames.length,
            status: 'pending'
          })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ 
          campaign: data,
          message: `Created mention campaign for ${usernames.length} users`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list_campaigns': {
        const { status } = params
        
        let query = supabase
          .from('instagram_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)

        const { data, error } = await query

        if (error) throw error
        return new Response(JSON.stringify({ campaigns: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_campaign_stats': {
        const { campaign_id } = params
        
        const { data, error } = await supabase
          .from('instagram_campaigns')
          .select('*')
          .eq('id', campaign_id)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ 
          campaign: data,
          stats: {
            progress: data.total_recipients > 0 
              ? ((data.sent_count / data.total_recipients) * 100).toFixed(1) 
              : 0,
            success_rate: data.sent_count > 0
              ? (((data.sent_count - data.failed_count) / data.sent_count) * 100).toFixed(1)
              : 0
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
    console.error('Instagram send error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
