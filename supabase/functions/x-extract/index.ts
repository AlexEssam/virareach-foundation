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
    console.log(`X extract action: ${action}`, params)

    switch (action) {
      case 'followers': {
        const { source_username } = params
        
        const { data, error } = await supabase
          .from('x_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'followers',
            source_username,
            source: `https://x.com/${source_username}`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 100 }, (_, i) => ({
          username: `follower_${i + 1}`,
          display_name: `User ${i + 1}`,
          followers_count: Math.floor(Math.random() * 50000),
          verified: Math.random() > 0.9,
          bio: `Bio for user ${i + 1}`
        }))

        await supabase
          .from('x_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'interested_users': {
        const { keywords } = params
        
        const { data, error } = await supabase
          .from('x_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'interested_users',
            source: keywords.join(', '),
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 50 }, (_, i) => ({
          username: `interested_${i + 1}`,
          display_name: `Interested User ${i + 1}`,
          recent_tweet: `Tweet about ${keywords[0]}...`,
          engagement_score: Math.floor(Math.random() * 100)
        }))

        await supabase
          .from('x_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'tweet_interactors': {
        const { tweet_url } = params
        
        const { data, error } = await supabase
          .from('x_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'tweet_interactors',
            source: tweet_url,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = {
          likers: Array.from({ length: 30 }, (_, i) => ({
            username: `liker_${i + 1}`,
            display_name: `Liker ${i + 1}`
          })),
          retweeters: Array.from({ length: 15 }, (_, i) => ({
            username: `retweeter_${i + 1}`,
            display_name: `Retweeter ${i + 1}`
          })),
          commenters: Array.from({ length: 20 }, (_, i) => ({
            username: `commenter_${i + 1}`,
            display_name: `Commenter ${i + 1}`,
            comment: `Comment ${i + 1}`
          }))
        }

        await supabase
          .from('x_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: 65,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: 65 } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'trends': {
        const { country_code } = params
        
        const { data, error } = await supabase
          .from('x_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'trends',
            country_code,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockTrends = Array.from({ length: 30 }, (_, i) => ({
          rank: i + 1,
          name: `#Trend${i + 1}`,
          tweet_volume: Math.floor(Math.random() * 500000) + 10000,
          url: `https://x.com/search?q=%23Trend${i + 1}`
        }))

        await supabase
          .from('x_extractions')
          .update({
            status: 'completed',
            results: mockTrends,
            result_count: mockTrends.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        // Also save to trends table
        await supabase
          .from('x_trends')
          .insert({
            user_id: user.id,
            country_code,
            trends: mockTrends
          })

        return new Response(JSON.stringify({ extraction: { ...data, results: mockTrends, result_count: mockTrends.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'competitor_customers': {
        const { competitor_usernames } = params
        
        const { data, error } = await supabase
          .from('x_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'competitor_customers',
            source: competitor_usernames.join(', '),
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = competitor_usernames.flatMap((competitor: string, idx: number) => 
          Array.from({ length: 25 }, (_, i) => ({
            username: `${competitor}_customer_${i + 1}`,
            source_competitor: competitor,
            interaction_type: ['follower', 'engager', 'customer'][Math.floor(Math.random() * 3)],
            followers_count: Math.floor(Math.random() * 10000)
          }))
        )

        await supabase
          .from('x_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'emails_by_interest': {
        const { keywords, filters } = params
        
        const { data, error } = await supabase
          .from('x_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'emails_by_interest',
            source: keywords.join(', '),
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 75 }, (_, i) => ({
          username: `user_${i + 1}`,
          display_name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          bio: `Interested in ${keywords[0]}`,
          followers_count: Math.floor(Math.random() * 50000),
          verified: Math.random() > 0.9,
          location: ['USA', 'UK', 'Canada', 'Germany'][Math.floor(Math.random() * 4)]
        }))

        await supabase
          .from('x_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list': {
        const { data, error } = await supabase
          .from('x_extractions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return new Response(JSON.stringify({ extractions: data }), {
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
    console.error('X extract error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
