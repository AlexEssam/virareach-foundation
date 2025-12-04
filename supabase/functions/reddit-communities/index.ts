import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, params } = await req.json();
    console.log(`Reddit communities action: ${action}`, params);

    switch (action) {
      case 'extract_trending': {
        const { data: job, error: jobError } = await supabase
          .from('reddit_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'trending_communities',
            status: 'processing'
          })
          .select()
          .single();

        if (jobError) throw jobError;

        // Generate mock trending communities
        const mockCommunities = Array.from({ length: 25 }, (_, i) => ({
          user_id: user.id,
          subreddit_name: `trending_${Date.now()}_${i}`,
          display_name: `Trending Community ${i + 1}`,
          subscribers: Math.floor(Math.random() * 2000000) + 50000,
          active_users: Math.floor(Math.random() * 10000) + 500,
          category: ['Technology', 'Gaming', 'News', 'Sports', 'Entertainment'][Math.floor(Math.random() * 5)],
          status: 'discovered'
        }));

        await supabase.from('reddit_communities').insert(mockCommunities);
        await supabase
          .from('reddit_extractions')
          .update({ status: 'completed', result_count: mockCommunities.length, completed_at: new Date().toISOString() })
          .eq('id', job.id);

        return new Response(JSON.stringify({ success: true, count: mockCommunities.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'search_communities': {
        const { data: job, error: jobError } = await supabase
          .from('reddit_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'keyword_search',
            keyword: params.keyword,
            status: 'processing'
          })
          .select()
          .single();

        if (jobError) throw jobError;

        const keyword = params.keyword.toLowerCase().replace(/\s/g, '');
        const mockResults = Array.from({ length: 15 }, (_, i) => ({
          user_id: user.id,
          subreddit_name: `${keyword}_${i + 1}`,
          display_name: `${params.keyword} Community ${i + 1}`,
          description: `A community dedicated to ${params.keyword}`,
          subscribers: Math.floor(Math.random() * 500000) + 10000,
          active_users: Math.floor(Math.random() * 3000) + 100,
          category: params.keyword,
          status: 'discovered'
        }));

        await supabase.from('reddit_communities').insert(mockResults);
        await supabase
          .from('reddit_extractions')
          .update({ status: 'completed', result_count: mockResults.length, completed_at: new Date().toISOString() })
          .eq('id', job.id);

        return new Response(JSON.stringify({ success: true, count: mockResults.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'join_community': {
        const { error } = await supabase
          .from('reddit_communities')
          .update({ 
            is_joined: true, 
            joined_at: new Date().toISOString(),
            account_id: params.account_id
          })
          .eq('id', params.community_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_communities': {
        const query = supabase
          .from('reddit_communities')
          .select('*')
          .order('subscribers', { ascending: false })
          .limit(100);

        if (params.joined_only) {
          query.eq('is_joined', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, communities: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Reddit communities error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});