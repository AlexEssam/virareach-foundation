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
    console.log(`Reddit actions: ${action}`, params);

    switch (action) {
      case 'bulk_upvote': {
        const actions = [];
        for (const url of params.post_urls) {
          for (const accountId of params.account_ids) {
            actions.push({
              user_id: user.id,
              account_id: accountId,
              target_post_url: url,
              action_type: 'upvote',
              status: 'pending'
            });
          }
        }

        const { data, error } = await supabase.from('reddit_upvotes').insert(actions).select();
        if (error) throw error;

        // Simulate execution with random delays
        for (const upvote of data) {
          const delay = Math.floor(Math.random() * (params.max_delay - params.min_delay) + params.min_delay) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          await supabase
            .from('reddit_upvotes')
            .update({ status: 'completed', executed_at: new Date().toISOString() })
            .eq('id', upvote.id);
        }

        return new Response(JSON.stringify({ success: true, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_save': {
        const saves = [];
        for (const url of params.post_urls) {
          for (const accountId of params.account_ids) {
            saves.push({
              user_id: user.id,
              account_id: accountId,
              post_url: url,
              status: 'pending'
            });
          }
        }

        const { data, error } = await supabase.from('reddit_saved').insert(saves).select();
        if (error) throw error;

        for (const save of data) {
          const delay = Math.floor(Math.random() * (params.max_delay - params.min_delay) + params.min_delay) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          await supabase
            .from('reddit_saved')
            .update({ status: 'completed', saved_at: new Date().toISOString() })
            .eq('id', save.id);
        }

        return new Response(JSON.stringify({ success: true, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_post': {
        const { data: post, error } = await supabase
          .from('reddit_posts')
          .insert({
            user_id: user.id,
            account_id: params.account_id,
            subreddit: params.subreddit,
            post_type: params.post_type,
            title: params.title,
            content: params.content,
            image_url: params.image_url,
            link_url: params.link_url,
            flair: params.flair,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        // Simulate publishing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await supabase
          .from('reddit_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            reddit_post_id: `t3_${Math.random().toString(36).substring(7)}`
          })
          .eq('id', post.id);

        return new Response(JSON.stringify({ success: true, post_id: post.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_post': {
        const posts = params.subreddits.map((subreddit: string) => ({
          user_id: user.id,
          account_id: params.account_id,
          subreddit,
          post_type: params.post_type,
          title: params.title,
          content: params.content,
          image_url: params.image_url,
          link_url: params.link_url,
          status: 'pending'
        }));

        const { data, error } = await supabase.from('reddit_posts').insert(posts).select();
        if (error) throw error;

        // Simulate publishing with anti-ban delays
        for (const post of data) {
          const delay = Math.floor(Math.random() * 5000 + 3000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          await supabase
            .from('reddit_posts')
            .update({
              status: 'published',
              published_at: new Date().toISOString(),
              reddit_post_id: `t3_${Math.random().toString(36).substring(7)}`
            })
            .eq('id', post.id);
        }

        return new Response(JSON.stringify({ success: true, count: data.length }), {
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
    console.error('Reddit actions error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});