import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

async function callAI(systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits to continue.')
    }
    throw new Error('AI gateway error')
  }

  const data = await response.json()
  return data.choices[0].message.content
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
    console.log(`X Plus AI action: ${action}`, params)

    switch (action) {
      case 'analyze_activity': {
        const { account_username, recent_tweets } = params
        
        const systemPrompt = `You are an AI social media analyst specializing in X/Twitter activity monitoring. Analyze account activity patterns and provide insights.`
        const userPrompt = `Analyze the following account activity for @${account_username}:
Recent tweets: ${JSON.stringify(recent_tweets || [])}
Provide:
1. Activity pattern analysis (posting times, frequency)
2. Engagement health score (0-100)
3. Content performance insights
4. Risk indicators (shadowban, rate limits)
5. Recommendations for improvement
Format as JSON with keys: pattern_analysis, health_score, performance_insights, risk_indicators, recommendations`

        const analysis = await callAI(systemPrompt, userPrompt)
        
        return new Response(JSON.stringify({ 
          analysis,
          account: account_username,
          analyzed_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'tag_interested_customers': {
        const { comments, product_keywords } = params
        
        const systemPrompt = `You are an AI that identifies potential customers from social media comments. Tag users showing buying intent or interest in specific products/services.`
        const userPrompt = `Analyze these comments and identify interested customers:
Comments: ${JSON.stringify(comments)}
Product keywords: ${product_keywords.join(', ')}

For each interested user, provide:
1. Username
2. Interest score (0-100)
3. Intent type (buying, researching, competitor_customer)
4. Suggested approach
Format as JSON array with keys: username, interest_score, intent_type, suggested_approach`

        const taggedCustomers = await callAI(systemPrompt, userPrompt)
        
        return new Response(JSON.stringify({ 
          tagged_customers: taggedCustomers,
          total_analyzed: comments.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'auto_engage_first_tweet': {
        const { target_users, niche, tone } = params
        
        const systemPrompt = `You are an AI that crafts personalized, engaging first interactions for Twitter/X. Create authentic, non-spammy engagement messages that start conversations naturally.`
        const userPrompt = `Generate personalized first-tweet engagement strategies for these users:
Target users: ${JSON.stringify(target_users)}
Niche: ${niche}
Desired tone: ${tone}

For each user, generate:
1. Personalized comment/reply
2. Best timing to engage
3. Conversation starter hook
Format as JSON array with keys: username, comment, best_time, hook, engagement_type`

        const engagementPlan = await callAI(systemPrompt, userPrompt)
        
        return new Response(JSON.stringify({ 
          engagement_plan: engagementPlan,
          users_targeted: target_users.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'trend_booster_generate': {
        const { topic, target_volume, style } = params
        
        const systemPrompt = `You are an AI content strategist for viral Twitter/X campaigns. Generate diverse, engaging tweet variations that can boost trends without appearing artificial.`
        const userPrompt = `Create tweet templates for a trend boosting campaign:
Topic: ${topic}
Target volume: ${target_volume} tweets
Style: ${style}

Generate 10 unique tweet templates with:
1. Main tweet text (with variations)
2. Hashtag combinations
3. Engagement hooks
4. Best posting schedule
5. Account tier (new/established/influencer)
Format as JSON array with keys: template, hashtags, hook, schedule, account_tier, variation_count`

        const tweetTemplates = await callAI(systemPrompt, userPrompt)
        
        return new Response(JSON.stringify({ 
          templates: tweetTemplates,
          target_volume,
          estimated_reach: target_volume * 50
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'demographic_analysis': {
        const { users_data } = params
        
        const systemPrompt = `You are an AI demographic analyst specializing in social media audience analysis. Analyze user data to identify demographics, interests, and behavioral patterns.`
        const userPrompt = `Analyze these Twitter/X users for demographic insights:
User data: ${JSON.stringify(users_data)}

Provide comprehensive analysis:
1. Age distribution estimate
2. Gender distribution
3. Location clusters
4. Interest categories
5. Profession/industry breakdown
6. Engagement behavior patterns
7. Best targeting strategy
Format as JSON with keys: age_distribution, gender_distribution, locations, interests, professions, behavior_patterns, targeting_strategy`

        const demographics = await callAI(systemPrompt, userPrompt)
        
        return new Response(JSON.stringify({ 
          demographics,
          users_analyzed: users_data.length,
          confidence_score: 0.85
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'smart_mention_generator': {
        const { tweet_context, target_users, goal } = params
        
        const systemPrompt = `You are an AI that creates strategic mention strategies for Twitter/X. Generate natural-sounding tweets that mention users in ways that encourage engagement and responses.`
        const userPrompt = `Create smart mention tweets:
Tweet context/topic: ${tweet_context}
Target users to mention: ${JSON.stringify(target_users)}
Goal: ${goal}

Generate:
1. Tweet variations with strategic mentions
2. Best mention placement
3. Call-to-action suggestions
4. Response probability score
Format as JSON array with keys: tweet_text, mention_placement, cta, response_probability, engagement_type`

        const mentionTweets = await callAI(systemPrompt, userPrompt)
        
        return new Response(JSON.stringify({ 
          mention_tweets: mentionTweets,
          users_mentioned: target_users.length
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
    console.error('X Plus AI error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
