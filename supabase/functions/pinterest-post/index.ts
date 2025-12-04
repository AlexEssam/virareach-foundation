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
    console.log(`Pinterest post action: ${action}`, params);

    switch (action) {
      case 'create_pin': {
        const { data: post, error: postError } = await supabase
          .from('pinterest_posts')
          .insert({
            user_id: user.id,
            account_id: params.account_id,
            board_id: params.board_id,
            post_type: 'pin',
            title: params.title,
            description: params.description,
            image_url: params.image_url,
            destination_url: params.destination_url,
            status: 'pending'
          })
          .select()
          .single();

        if (postError) throw postError;

        // Simulate publishing
        await supabase
          .from('pinterest_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', post.id);

        return new Response(JSON.stringify({ success: true, post_id: post.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'repin': {
        const { data: post, error: postError } = await supabase
          .from('pinterest_posts')
          .insert({
            user_id: user.id,
            account_id: params.account_id,
            board_id: params.board_id,
            post_type: 'repin',
            description: params.description,
            source_pin_url: params.source_pin_url,
            status: 'pending'
          })
          .select()
          .single();

        if (postError) throw postError;

        // Simulate repinning
        await supabase
          .from('pinterest_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', post.id);

        return new Response(JSON.stringify({ success: true, post_id: post.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_repin': {
        const posts = params.pin_urls.map((url: string) => ({
          user_id: user.id,
          account_id: params.account_id,
          board_id: params.board_id,
          post_type: 'repin',
          source_pin_url: url,
          status: 'pending'
        }));

        const { data, error } = await supabase
          .from('pinterest_posts')
          .insert(posts)
          .select();

        if (error) throw error;

        // Simulate publishing all
        for (const post of data) {
          await supabase
            .from('pinterest_posts')
            .update({
              status: 'published',
              published_at: new Date().toISOString()
            })
            .eq('id', post.id);
        }

        return new Response(JSON.stringify({ success: true, published: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_posts': {
        const query = supabase
          .from('pinterest_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (params.status) {
          query.eq('status', params.status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, posts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_post': {
        const { error } = await supabase
          .from('pinterest_posts')
          .delete()
          .eq('id', params.post_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
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
    console.error('Pinterest post error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});