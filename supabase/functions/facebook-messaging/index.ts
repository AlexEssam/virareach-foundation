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
      const { message_type, target_type, content, media_urls, recipients, account_id } = body;

      console.log(`Facebook messaging: type=${message_type}, target=${target_type}, recipients=${recipients?.length || 0}`);

      // Validate required fields
      if (!message_type || !recipients || recipients.length === 0) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify account ownership if provided
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

      // Create message campaign record
      const { data: campaign, error: insertError } = await supabase
        .from("facebook_messages")
        .insert({
          user_id: user.id,
          account_id,
          message_type,
          target_type,
          content,
          media_urls,
          recipients,
          total_recipients: recipients.length,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating message campaign:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simulate messaging process
      const successRate = 0.85 + Math.random() * 0.1;
      const sentCount = Math.floor(recipients.length * successRate);
      const failedCount = recipients.length - sentCount;

      // Update campaign with results
      await supabase
        .from("facebook_messages")
        .update({
          status: "completed",
          sent_count: sentCount,
          failed_count: failedCount,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      return new Response(JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        sent_count: sentCount,
        failed_count: failedCount,
        message: `Sent ${sentCount} messages (simulation mode)`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const messageType = url.searchParams.get("message_type");

      let query = supabase
        .from("facebook_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (messageType) {
        query = query.eq("message_type", messageType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching messages:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ campaigns: data }), {
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
