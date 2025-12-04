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
      case 'extract_followers': {
        const { source_username, limit } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'followers',
          source_username,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_following': {
        const { source_username } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'following',
          source_username,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_hashtag': {
        const { hashtag } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'hashtag',
          hashtag: hashtag.replace('#', ''),
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_famous_users': {
        const { country_code } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'famous_users',
          country_code,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_video_commenters': {
        const { video_url } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'video_commenters',
          source: video_url,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'extract_video_likers': {
        const { video_url } = body;
        const { data, error } = await supabase.from('tiktok_extractions').insert({
          user_id: user.id,
          extraction_type: 'video_likers',
          source: video_url,
          status: 'pending'
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_extractions': {
        const { data, error } = await supabase.from('tiktok_extractions')
          .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, extractions: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
