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
        const { source_username } = params
        
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

        const mockResults = competitor_usernames.flatMap((competitor: string) => 
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

      // NEW: Niche-targeted customers with statistics
      case 'niche_customers': {
        const { niche, country, min_followers, max_followers } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'niche_customers',
            source: `${niche}_${country || 'global'}`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = {
          customers: Array.from({ length: 50 }, (_, i) => ({
            username: `${niche}_customer_${i + 1}`,
            full_name: `${niche} Customer ${i + 1}`,
            follower_count: Math.floor(Math.random() * (max_followers || 50000)) + (min_followers || 100),
            following_count: Math.floor(Math.random() * 2000),
            posts_count: Math.floor(Math.random() * 500),
            engagement_rate: (Math.random() * 8 + 0.5).toFixed(2),
            is_business: Math.random() > 0.6,
            niche_relevance_score: Math.floor(Math.random() * 40) + 60,
            country: country || ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)]
          })),
          statistics: {
            total_found: 50,
            avg_followers: 12500,
            avg_engagement: 3.2,
            business_accounts: 30,
            personal_accounts: 20,
            niche_distribution: {
              [niche]: 100
            },
            country_distribution: [
              { country: 'US', count: 20 },
              { country: 'UK', count: 12 },
              { country: 'CA', count: 8 },
              { country: 'AU', count: 6 },
              { country: 'DE', count: 4 }
            ]
          }
        }

        await supabase
          .from('instagram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.customers.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.customers.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // NEW: Hashtag extraction with analytics
      case 'hashtag_analytics': {
        const { hashtag } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'hashtag_analytics',
            source: hashtag,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = {
          hashtag: hashtag,
          total_posts: Math.floor(Math.random() * 10000000) + 100000,
          daily_posts: Math.floor(Math.random() * 50000) + 1000,
          weekly_growth: (Math.random() * 15 + 1).toFixed(2),
          avg_likes: Math.floor(Math.random() * 5000) + 100,
          avg_comments: Math.floor(Math.random() * 200) + 10,
          top_posts: Array.from({ length: 10 }, (_, i) => ({
            post_id: `post_${i + 1}`,
            username: `top_user_${i + 1}`,
            likes: Math.floor(Math.random() * 100000) + 10000,
            comments: Math.floor(Math.random() * 5000) + 100,
            posted_at: new Date(Date.now() - i * 86400000).toISOString()
          })),
          related_hashtags: Array.from({ length: 20 }, (_, i) => ({
            tag: `related_${hashtag}_${i + 1}`,
            posts_count: Math.floor(Math.random() * 1000000),
            correlation_score: (Math.random() * 0.5 + 0.5).toFixed(2)
          })),
          engagement_by_time: {
            best_hours: [9, 12, 17, 20],
            best_days: ['Monday', 'Wednesday', 'Saturday']
          },
          top_locations: [
            { country: 'United States', percentage: 35 },
            { country: 'Brazil', percentage: 12 },
            { country: 'India', percentage: 10 },
            { country: 'United Kingdom', percentage: 8 },
            { country: 'Mexico', percentage: 7 }
          ],
          difficulty_score: Math.floor(Math.random() * 40) + 60,
          recommended_use: Math.random() > 0.5 ? 'high_volume' : 'niche_targeting'
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

      // NEW: Famous users by country
      case 'famous_by_country': {
        const { country_code, category, min_followers } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'famous_by_country',
            source: `${country_code}_${category || 'all'}`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const categories = ['Entertainment', 'Sports', 'Fashion', 'Business', 'Music', 'Art']
        const mockResults = Array.from({ length: 30 }, (_, i) => ({
          username: `famous_${country_code}_${i + 1}`,
          full_name: `Famous User ${i + 1}`,
          verified: Math.random() > 0.3,
          follower_count: Math.floor(Math.random() * 10000000) + (min_followers || 100000),
          following_count: Math.floor(Math.random() * 1000) + 100,
          posts_count: Math.floor(Math.random() * 5000) + 100,
          engagement_rate: (Math.random() * 5 + 1).toFixed(2),
          category: category || categories[Math.floor(Math.random() * categories.length)],
          country: country_code,
          bio: `Famous ${category || 'public figure'} from ${country_code}`,
          avg_likes: Math.floor(Math.random() * 500000) + 10000,
          avg_comments: Math.floor(Math.random() * 10000) + 500
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

      // NEW: Full customer analysis
      case 'customer_analysis': {
        const { usernames } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'customer_analysis',
            source: `analysis_${usernames.length}_users`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = {
          users: usernames.map((username: string, i: number) => ({
            username,
            full_name: `User ${username}`,
            bio: `Bio for ${username}`,
            follower_count: Math.floor(Math.random() * 100000) + 100,
            following_count: Math.floor(Math.random() * 2000) + 50,
            posts_count: Math.floor(Math.random() * 1000) + 10,
            is_private: Math.random() > 0.7,
            is_verified: Math.random() > 0.9,
            is_business: Math.random() > 0.5,
            engagement_rate: (Math.random() * 10 + 0.5).toFixed(2),
            avg_likes: Math.floor(Math.random() * 5000) + 50,
            avg_comments: Math.floor(Math.random() * 200) + 5,
            follower_growth_30d: (Math.random() * 20 - 5).toFixed(2),
            posting_frequency: ['daily', 'weekly', 'bi-weekly', 'monthly'][Math.floor(Math.random() * 4)],
            most_active_hours: [9, 12, 18, 21].slice(0, Math.floor(Math.random() * 3) + 1),
            top_hashtags: Array.from({ length: 5 }, (_, j) => `hashtag_${j + 1}`),
            content_types: {
              photos: Math.floor(Math.random() * 70) + 20,
              videos: Math.floor(Math.random() * 20) + 5,
              reels: Math.floor(Math.random() * 20) + 5,
              carousels: Math.floor(Math.random() * 15)
            }
          })),
          summary: {
            total_analyzed: usernames.length,
            avg_followers: Math.floor(Math.random() * 50000) + 5000,
            avg_engagement: (Math.random() * 5 + 1).toFixed(2),
            business_ratio: Math.floor(Math.random() * 40) + 30,
            private_ratio: Math.floor(Math.random() * 30) + 10,
            most_common_content: 'photos',
            best_posting_time: '18:00'
          }
        }

        await supabase
          .from('instagram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.users.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.users.length } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // NEW: Competitor analysis by country
      case 'competitor_analysis': {
        const { competitor_usernames, country_code } = params
        
        const { data, error } = await supabase
          .from('instagram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'competitor_analysis',
            source: `competitors_${country_code || 'global'}`,
            status: 'processing'
          })
          .select()
          .single()

        if (error) throw error

        const mockResults = {
          competitors: competitor_usernames.map((username: string) => ({
            username,
            full_name: `${username} Business`,
            follower_count: Math.floor(Math.random() * 500000) + 10000,
            following_count: Math.floor(Math.random() * 1000) + 100,
            posts_count: Math.floor(Math.random() * 2000) + 200,
            engagement_rate: (Math.random() * 6 + 1).toFixed(2),
            avg_likes: Math.floor(Math.random() * 20000) + 500,
            avg_comments: Math.floor(Math.random() * 500) + 20,
            posting_frequency: `${Math.floor(Math.random() * 5) + 1} posts/week`,
            top_content_types: ['Reels', 'Carousels', 'Stories'][Math.floor(Math.random() * 3)],
            audience_overlap: Math.floor(Math.random() * 40) + 10,
            growth_rate_30d: (Math.random() * 10 - 2).toFixed(2),
            strengths: ['High engagement', 'Consistent posting', 'Quality content'].slice(0, Math.floor(Math.random() * 2) + 1),
            weaknesses: ['Low video content', 'Irregular schedule'].slice(0, Math.floor(Math.random() * 2))
          })),
          market_analysis: {
            total_market_followers: competitor_usernames.length * 150000,
            avg_engagement_rate: 3.5,
            market_growth_trend: 'growing',
            content_trends: ['Short-form video', 'User-generated content', 'Behind-the-scenes'],
            optimal_posting_times: ['9:00 AM', '12:00 PM', '6:00 PM'],
            country_focus: country_code || 'Global',
            recommendations: [
              'Increase video content to match market trends',
              'Focus on user engagement through stories',
              'Post consistently during peak hours'
            ]
          },
          audience_insights: {
            common_interests: ['Technology', 'Lifestyle', 'Fashion'],
            age_distribution: { '18-24': 30, '25-34': 45, '35-44': 20, '45+': 5 },
            gender_split: { male: 48, female: 52 }
          }
        }

        await supabase
          .from('instagram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.competitors.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id)

        return new Response(JSON.stringify({ extraction: { ...data, results: mockResults, result_count: mockResults.competitors.length } }), {
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
