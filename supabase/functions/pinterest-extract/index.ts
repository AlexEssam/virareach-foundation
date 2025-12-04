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
    console.log(`Pinterest extract action: ${action}`, params);

    switch (action) {
      case 'extract_niche_users': {
        // Create extraction job
        const { data: job, error: jobError } = await supabase
          .from('pinterest_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'niche_users',
            niche: params.niche,
            status: 'processing'
          })
          .select()
          .single();

        if (jobError) throw jobError;

        // Simulate extraction (in production, this would call Pinterest API)
        const mockResults = generateMockUsers(params.niche, 50);
        
        // Update with results
        const { error: updateError } = await supabase
          .from('pinterest_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, job_id: job.id, results: mockResults }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'extract_niche_boards': {
        const { data: job, error: jobError } = await supabase
          .from('pinterest_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'niche_boards',
            niche: params.niche,
            status: 'processing'
          })
          .select()
          .single();

        if (jobError) throw jobError;

        const mockBoards = generateMockBoards(params.niche, 30);
        
        await supabase
          .from('pinterest_extractions')
          .update({
            status: 'completed',
            results: mockBoards,
            result_count: mockBoards.length,
            analytics: {
              avg_pins: Math.floor(Math.random() * 500) + 100,
              avg_followers: Math.floor(Math.random() * 10000) + 1000,
              top_categories: [params.niche, 'Related', 'Popular']
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        return new Response(JSON.stringify({ success: true, job_id: job.id, results: mockBoards }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'extract_board_followers': {
        const { data: job, error: jobError } = await supabase
          .from('pinterest_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'board_followers',
            board_url: params.board_url,
            status: 'processing'
          })
          .select()
          .single();

        if (jobError) throw jobError;

        const mockFollowers = generateMockUsers('board', 100);
        
        await supabase
          .from('pinterest_extractions')
          .update({
            status: 'completed',
            results: mockFollowers,
            result_count: mockFollowers.length,
            analytics: {
              demographics: { age_25_34: 45, age_35_44: 30, age_18_24: 25 },
              engagement_rate: (Math.random() * 5 + 2).toFixed(2),
              best_posting_times: ['9:00 AM', '12:00 PM', '7:00 PM'],
              top_interests: ['Home Decor', 'DIY', 'Fashion']
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        return new Response(JSON.stringify({ success: true, job_id: job.id, results: mockFollowers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_extractions': {
        const { data, error } = await supabase
          .from('pinterest_extractions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extractions: data }), {
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
    console.error('Pinterest extract error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockUsers(niche: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `User ${i + 1}`,
    username: `${niche.toLowerCase().replace(/\s/g, '_')}_user_${i + 1}`,
    followers: Math.floor(Math.random() * 50000) + 100,
    following: Math.floor(Math.random() * 2000) + 50,
    posts_count: Math.floor(Math.random() * 500) + 10,
    profile_url: `https://pinterest.com/${niche.toLowerCase()}_user_${i + 1}`
  }));
}

function generateMockBoards(niche: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    board_name: `${niche} Board ${i + 1}`,
    board_url: `https://pinterest.com/user/board_${i + 1}`,
    owner_username: `user_${i + 1}`,
    pins_count: Math.floor(Math.random() * 1000) + 50,
    followers_count: Math.floor(Math.random() * 20000) + 100,
    description: `A collection of ${niche.toLowerCase()} ideas and inspiration`
  }));
}