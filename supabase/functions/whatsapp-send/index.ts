import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limits in messages per minute
const RATE_LIMITS = {
  "10_per_min": { messages: 10, interval: 60000 },
  "20_per_min": { messages: 20, interval: 60000 },
  "35_per_min": { messages: 35, interval: 60000 },
  "group_add": { messages: 250, interval: 180000 }, // 250 per 3 min
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
      const { 
        campaign_name,
        account_id, 
        message_type, 
        content, 
        media_url,
        recipients, 
        sending_mode 
      } = body;

      console.log(`WhatsApp send: type=${message_type}, mode=${sending_mode}, recipients=${recipients?.length || 0}`);

      // Validate required fields
      if (!campaign_name || !message_type || !recipients || recipients.length === 0) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify account belongs to user if provided
      if (account_id) {
        const { data: account, error: accountError } = await supabase
          .from("whatsapp_accounts")
          .select("id, status")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .single();

        if (accountError || !account) {
          return new Response(JSON.stringify({ error: "Account not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (account.status === "banned" || account.status === "rate_limited") {
          return new Response(JSON.stringify({ error: `Account is ${account.status}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create campaign record
      const { data: campaign, error: insertError } = await supabase
        .from("whatsapp_campaigns")
        .insert({
          user_id: user.id,
          account_id: account_id || null,
          campaign_name,
          message_type,
          content,
          media_url,
          recipients,
          sending_mode: sending_mode || "10_per_min",
          total_recipients: recipients.length,
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating campaign:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simulate sending process with rate limiting
      const rateLimit = RATE_LIMITS[sending_mode as keyof typeof RATE_LIMITS] || RATE_LIMITS["10_per_min"];
      const successRate = 0.92; // 92% success rate simulation
      const sentCount = Math.floor(recipients.length * successRate);
      const failedCount = recipients.length - sentCount;

      // Calculate estimated time
      const estimatedTime = Math.ceil((recipients.length / rateLimit.messages) * (rateLimit.interval / 1000));

      // Update campaign with results
      const { error: updateError } = await supabase
        .from("whatsapp_campaigns")
        .update({
          status: "completed",
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      if (updateError) {
        console.error("Error updating campaign:", updateError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        campaign_id: campaign.id,
        sent_count: sentCount,
        failed_count: failedCount,
        estimated_time_seconds: estimatedTime,
        rate_limit: `${rateLimit.messages} messages per ${rateLimit.interval / 1000}s`,
        message: `Campaign completed: ${sentCount}/${recipients.length} messages sent (simulation mode)`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Get user's campaigns
      const { data, error } = await supabase
        .from("whatsapp_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching campaigns:", error);
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
