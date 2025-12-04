import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    console.log(`TikTok extract action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      // ============ USER DATA EXTRACTION ============
      case 'extract_followers': {
        const { source_username, limit = 1000 } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'followers',
          source_username: source_username?.replace('@', ''),
          status: 'pending',
          results: { limit, include_metadata: true }
        }).select().single();
        if (error) throw error;
        console.log(`Created followers extraction for @${source_username}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_following': {
        const { source_username, limit = 1000 } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'following',
          source_username: source_username?.replace('@', ''),
          status: 'pending',
          results: { limit, include_metadata: true }
        }).select().single();
        if (error) throw error;
        console.log(`Created following extraction for @${source_username}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ POSTS EXTRACTION ============
      case 'extract_posts': {
        const { source_username, limit = 50 } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'posts',
          source_username: source_username?.replace('@', ''),
          status: 'pending',
          results: { limit, include_engagement: true, include_hashtags: true }
        }).select().single();
        if (error) throw error;
        console.log(`Created posts extraction for @${source_username}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ ENGAGEMENT EXTRACTION ============
      case 'extract_video_likers': {
        const { video_url, limit = 500 } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'video_likers',
          source: video_url,
          status: 'pending',
          results: { limit, include_metadata: true }
        }).select().single();
        if (error) throw error;
        console.log(`Created video likers extraction for ${video_url}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_video_commenters': {
        const { video_url, limit = 500, include_replies = true } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'video_commenters',
          source: video_url,
          status: 'pending',
          results: { limit, include_replies, include_metadata: true }
        }).select().single();
        if (error) throw error;
        console.log(`Created video commenters extraction for ${video_url}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ NICHE/INTEREST EXTRACTION ============
      case 'extract_by_niche': {
        const { niche, country_code, limit = 500, min_followers = 1000 } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'niche_customers',
          hashtag: niche,
          country_code,
          status: 'pending',
          results: { 
            limit, 
            min_followers,
            generate_statistics: true,
            include_engagement_rate: true
          }
        }).select().single();
        if (error) throw error;
        console.log(`Created niche extraction for ${niche} in ${country_code}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ FAMOUS USERS EXTRACTION ============
      case 'extract_famous_users': {
        const { country_code, category, limit = 100, min_followers = 100000 } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'famous_users',
          country_code,
          status: 'pending',
          results: { 
            limit, 
            min_followers,
            category,
            include_contact_info: true,
            include_statistics: true
          }
        }).select().single();
        if (error) throw error;
        console.log(`Created famous users extraction for ${country_code}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ HASHTAG EXTRACTION & ANALYTICS ============
      case 'extract_hashtag': {
        const { hashtag, limit = 100 } = body;
        const cleanHashtag = hashtag.replace('#', '');
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'hashtag',
          hashtag: cleanHashtag,
          status: 'pending',
          results: { limit, include_analytics: true }
        }).select().single();
        if (error) throw error;
        console.log(`Created hashtag extraction for #${cleanHashtag}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_hashtag_analytics': {
        const { hashtag } = body;
        const cleanHashtag = hashtag.replace('#', '');
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'hashtag_analytics',
          hashtag: cleanHashtag,
          status: 'pending',
          results: {
            include_views: true,
            include_posts_count: true,
            include_trending_status: true,
            include_related_hashtags: true,
            include_top_creators: true,
            include_engagement_metrics: true
          }
        }).select().single();
        if (error) throw error;
        console.log(`Created hashtag analytics for #${cleanHashtag}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ FULL CUSTOMER DATA ANALYSIS ============
      case 'analyze_customer': {
        const { username } = body;
        const cleanUsername = username.replace('@', '');
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'customer_analysis',
          source_username: cleanUsername,
          status: 'pending',
          results: {
            include_followers_count: true,
            include_following_count: true,
            include_posts_count: true,
            include_likes_count: true,
            include_engagement_rate: true,
            include_posting_frequency: true,
            include_top_hashtags: true,
            include_audience_demographics: true,
            include_growth_trends: true
          }
        }).select().single();
        if (error) throw error;
        console.log(`Created customer analysis for @${cleanUsername}`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'bulk_analyze_customers': {
        const { usernames } = body;
        const cleanUsernames = usernames.map((u: string) => u.replace('@', ''));
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'bulk_customer_analysis',
          status: 'pending',
          results: {
            usernames: cleanUsernames,
            include_all_metrics: true,
            generate_report: true
          }
        }).select().single();
        if (error) throw error;
        console.log(`Created bulk customer analysis for ${cleanUsernames.length} users`);
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ============ HISTORY & RESULTS ============
      case 'get_extractions': {
        const { data, error } = await supabase.from('tiktok_extractions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extractions: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_extraction_results': {
        const { extraction_id } = body;
        const { data, error } = await supabase.from('tiktok_extractions')
          .select('*')
          .eq('id', extraction_id)
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'export_results': {
        const { extraction_id, format = 'csv' } = body;
        const { data, error } = await supabase.from('tiktok_extractions')
          .select('results')
          .eq('id', extraction_id)
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        
        // Format results for export
        const results = data?.results || [];
        console.log(`Exporting ${extraction_id} as ${format}`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: results,
          format,
          download_ready: true
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: unknown) {
    console.error('Error in tiktok-extract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
