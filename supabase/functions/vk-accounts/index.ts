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

    const { action, params } = await req.json();
    console.log(`VK accounts action: ${action}`, params);

    switch (action) {
      case "verify_account": {
        const { account_id } = params;
        
        // Simulate account verification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: updateError } = await supabase
          .from("vk_accounts")
          .update({ 
            status: "active",
            last_action_at: new Date().toISOString()
          })
          .eq("id", account_id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, message: "Account verified" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_stats": {
        const { data: accounts, error } = await supabase
          .from("vk_accounts")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        const stats = {
          total_accounts: accounts.length,
          active_accounts: accounts.filter(a => a.status === "active").length,
          total_friends: accounts.reduce((sum, a) => sum + (a.friends_count || 0), 0),
          messages_today: accounts.reduce((sum, a) => sum + (a.daily_message_count || 0), 0),
          friend_requests_today: accounts.reduce((sum, a) => sum + (a.daily_friend_request_count || 0), 0),
        };

        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
