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
    console.log(`X trends action: ${action}`, params)

    switch (action) {
      case 'get_trends': {
        const { country_code } = params
        
        // Check for cached trends (less than 15 minutes old)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        
        const { data: cached } = await supabase
          .from('x_trends')
          .select('*')
          .eq('user_id', user.id)
          .eq('country_code', country_code)
          .gte('fetched_at', fifteenMinutesAgo)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cached) {
          return new Response(JSON.stringify({ trends: cached.trends, cached: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Fetch new trends (mock data - in production would call X API)
        const mockTrends = Array.from({ length: 30 }, (_, i) => ({
          rank: i + 1,
          name: `#Trending${country_code}${i + 1}`,
          tweet_volume: Math.floor(Math.random() * 500000) + 10000,
          url: `https://x.com/search?q=%23Trending${country_code}${i + 1}`,
          category: ['Politics', 'Sports', 'Entertainment', 'Technology', 'Business'][Math.floor(Math.random() * 5)]
        }))

        // Cache the trends
        await supabase
          .from('x_trends')
          .insert({
            user_id: user.id,
            country_code,
            trends: mockTrends
          })

        return new Response(JSON.stringify({ trends: mockTrends, cached: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'monitor_keyword': {
        const { keyword } = params
        
        // Mock live monitoring data
        const mockTweets = Array.from({ length: 20 }, (_, i) => ({
          id: `tweet_${Date.now()}_${i}`,
          username: `user_${Math.floor(Math.random() * 1000)}`,
          display_name: `User ${i + 1}`,
          content: `Tweet about ${keyword}... ${i + 1}`,
          created_at: new Date(Date.now() - i * 60000).toISOString(),
          likes: Math.floor(Math.random() * 1000),
          retweets: Math.floor(Math.random() * 500),
          replies: Math.floor(Math.random() * 100)
        }))

        return new Response(JSON.stringify({ 
          keyword,
          tweets: mockTweets,
          tweet_count: mockTweets.length,
          monitoring: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_countries': {
        const countries = [
          { code: 'US', name: 'United States' },
          { code: 'GB', name: 'United Kingdom' },
          { code: 'CA', name: 'Canada' },
          { code: 'AU', name: 'Australia' },
          { code: 'DE', name: 'Germany' },
          { code: 'FR', name: 'France' },
          { code: 'JP', name: 'Japan' },
          { code: 'BR', name: 'Brazil' },
          { code: 'IN', name: 'India' },
          { code: 'MX', name: 'Mexico' },
          { code: 'ES', name: 'Spain' },
          { code: 'IT', name: 'Italy' },
          { code: 'NL', name: 'Netherlands' },
          { code: 'WW', name: 'Worldwide' }
        ]

        return new Response(JSON.stringify({ countries }), {
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
    console.error('X trends error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
