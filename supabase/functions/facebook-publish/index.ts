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
      const { publication_type, account_id, content, target_ids } = body;

      console.log(`Facebook publish: type=${publication_type}, account=${account_id}`);

      // Verify account belongs to user
      if (account_id) {
        const { data: account, error: accountError } = await supabase
          .from("facebook_accounts")
          .select("id")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .single();

        if (accountError || !account) {
          return new Response(JSON.stringify({ error: "Account not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create publication record
      const { data: publication, error: insertError } = await supabase
        .from("facebook_publications")
        .insert({
          user_id: user.id,
          account_id,
          publication_type,
          content,
          target_ids,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating publication:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simulate publishing process
      const targetCount = target_ids?.length || 1;
      const successCount = Math.floor(targetCount * 0.9); // 90% success rate simulation
      const failureCount = targetCount - successCount;

      // Update publication with results
      const { error: updateError } = await supabase
        .from("facebook_publications")
        .update({
          status: "completed",
          success_count: successCount,
          failure_count: failureCount,
        })
        .eq("id", publication.id);

      if (updateError) {
        console.error("Error updating publication:", updateError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        publication_id: publication.id,
        success_count: successCount,
        failure_count: failureCount,
        message: `Published to ${successCount}/${targetCount} targets (simulation mode)`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Get user's publications
      const { data, error } = await supabase
        .from("facebook_publications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching publications:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ publications: data }), {
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
