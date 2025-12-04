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
    console.log(`Instagram extract action: ${action}`, params)

    switch (action) {
      case 'followers': {
        // Extract followers from a username
        const { source_username, account_id } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'followers',
            source_username,
            source: `https://instagram.com/${source_username}`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        // Simulate extraction (in production, this would use Instagram API)
        const mockResults = Array.from({ length: 50 }, (_, i) => ({
          username: `follower_${i + 1}`,
          full_name: `User ${i + 1}`,
          is_private: Math.random() > 0.5,
          follower_count: Math.floor(Math.random() * 10000)
        }))

        await supabase
          .from('instagram_extractions')
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

      case 'following': {
        const { source_username } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'following',
            source_username,
            source: `https://instagram.com/${source_username}`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 30 }, (_, i) => ({
          username: `following_${i + 1}`,
          full_name: `Following User ${i + 1}`,
          is_private: Math.random() > 0.7
        }))

        await supabase
          .from('instagram_extractions')
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

      case 'post_likers': {
        const { post_url } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'post_likers',
            source: post_url,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 100 }, (_, i) => ({
          username: `liker_${i + 1}`,
          full_name: `Liker ${i + 1}`,
          profile_pic: null
        }))

        await supabase
          .from('instagram_extractions')
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

      case 'post_commenters': {
        const { post_url } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'post_commenters',
            source: post_url,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 25 }, (_, i) => ({
          username: `commenter_${i + 1}`,
          comment: `This is comment ${i + 1}`,
          timestamp: new Date(Date.now() - i * 3600000).toISOString()
        }))

        await supabase
          .from('instagram_extractions')
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

      case 'dm_customers': {
        const { account_id } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'dm_customers',
            source: 'direct_messages',
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 20 }, (_, i) => ({
          username: `customer_${i + 1}`,
          last_message_at: new Date(Date.now() - i * 86400000).toISOString(),
          message_count: Math.floor(Math.random() * 50) + 1
        }))

        await supabase
          .from('instagram_extractions')
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

      case 'influencers': {
        const { niche, min_followers } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'influencers',
            source: niche,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = Array.from({ length: 15 }, (_, i) => ({
          username: `influencer_${niche}_${i + 1}`,
          full_name: `${niche} Influencer ${i + 1}`,
          follower_count: Math.floor(Math.random() * 500000) + (min_followers || 10000),
          engagement_rate: (Math.random() * 5 + 1).toFixed(2),
          niche
        }))

        await supabase
          .from('instagram_extractions')
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

      case 'competitors_followers': {
        const { competitor_usernames } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'competitors_followers',
            source: competitor_usernames.join(', '),
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = competitor_usernames.flatMap((competitor: string, idx: number) => 
          Array.from({ length: 20 }, (_, i) => ({
            username: `${competitor}_follower_${i + 1}`,
            source_competitor: competitor,
            follower_count: Math.floor(Math.random() * 5000)
          }))
        )

        await supabase
          .from('instagram_extractions')
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

      case 'demographics': {
        const { source_username } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'demographics',
            source_username,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = {
          total_analyzed: 1000,
          gender: { male: 45, female: 52, other: 3 },
          age_groups: { '13-17': 5, '18-24': 35, '25-34': 40, '35-44': 15, '45+': 5 },
          top_locations: [
            { country: 'United States', percentage: 40 },
            { country: 'United Kingdom', percentage: 15 },
            { country: 'Canada', percentage: 10 },
            { country: 'Australia', percentage: 8 },
            { country: 'Germany', percentage: 7 }
          ],
          engagement_by_time: {
            best_hours: [9, 12, 18, 21],
            best_days: ['Tuesday', 'Thursday', 'Sunday']
          }
        }

        await supabase
          .from('instagram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: 1,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list': {
        const { data, error } = await supabase
          .from('instagram_extractions')
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
    console.error('Instagram extract error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
