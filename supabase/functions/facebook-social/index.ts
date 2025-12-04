import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action_type, targets, account_id, content } = body;

      console.log(`Facebook social action: type=${action_type}, targets=${targets?.length || 0}`);

      // Validate action type
      const validActions = [
        'friend_request', 'like_page', 'join_group', 'invite_to_page', 
        'invite_to_group', 'comment', 'delete_friends', 'delete_posts', 
        'mention_in_post', 'add_to_chat_group'
      ];

      if (!validActions.includes(action_type)) {
        return new Response(JSON.stringify({ error: "Invalid action type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify account ownership
      if (account_id) {
        const { data: account, error: accountError } = await supabase
          .from("facebook_accounts")
          .select("id")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .single();

        if (accountError || !account) {
          return new Response(JSON.stringify({ error: "Invalid account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Handle bulk actions (delete_friends, delete_posts)
      if (['delete_friends', 'delete_posts'].includes(action_type)) {
        const { data: action, error: insertError } = await supabase
          .from("facebook_social_actions")
          .insert({
            user_id: user.id,
            account_id,
            action_type,
            target_name: action_type === 'delete_friends' ? 'All Friends' : 'All Posts',
            status: "completed",
            executed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const mockCount = Math.floor(Math.random() * 500) + 50;
        return new Response(JSON.stringify({
          success: true,
          action_id: action.id,
          deleted_count: mockCount,
          message: `Deleted ${mockCount} ${action_type === 'delete_friends' ? 'friends' : 'posts'} (simulation mode)`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle multiple targets
      if (!targets || targets.length === 0) {
        return new Response(JSON.stringify({ error: "No targets provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const actions = targets.map((target: { id?: string; url?: string; name?: string }) => ({
        user_id: user.id,
        account_id,
        action_type,
        target_id: target.id,
        target_url: target.url,
        target_name: target.name,
        content,
        status: "pending",
      }));

      const { data: insertedActions, error: insertError } = await supabase
        .from("facebook_social_actions")
        .insert(actions)
        .select();

      if (insertError) {
        console.error("Error creating social actions:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simulate action execution
      const successRate = 0.85 + Math.random() * 0.1;
      const successCount = Math.floor(targets.length * successRate);

      // Update actions with results
      for (let i = 0; i < insertedActions.length; i++) {
        const isSuccess = i < successCount;
        await supabase
          .from("facebook_social_actions")
          .update({
            status: isSuccess ? "completed" : "failed",
            executed_at: new Date().toISOString(),
            error_message: isSuccess ? null : "Action failed (simulation)",
          })
          .eq("id", insertedActions[i].id);
      }

      return new Response(JSON.stringify({
        success: true,
        total: targets.length,
        completed: successCount,
        failed: targets.length - successCount,
        message: `Completed ${successCount}/${targets.length} ${action_type} actions (simulation mode)`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const actionType = url.searchParams.get("action_type");

      let query = supabase
        .from("facebook_social_actions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionType) {
        query = query.eq("action_type", actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching social actions:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ actions: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
