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
    console.log(`VK send action: ${action}`, params);

    switch (action) {
      case "create_campaign": {
        const {
          campaign_name,
          campaign_type,
          content,
          recipients,
          account_id,
          min_interval,
          max_interval,
        } = params;

        // Create campaign record
        const { data: campaign, error: insertError } = await supabase
          .from("vk_campaigns")
          .insert({
            user_id: user.id,
            campaign_name,
            campaign_type,
            content,
            recipients,
            account_id: account_id === "rotate" ? null : account_id,
            total_recipients: recipients.length,
            min_interval,
            max_interval,
            status: "running",
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating campaign:", insertError);
          throw insertError;
        }

        // If friend request campaign, create friend request records
        if (campaign_type === "friend_request") {
          const friendRequestRecords = recipients.map((recipient: string) => ({
            user_id: user.id,
            account_id: account_id === "rotate" ? null : account_id,
            target_vk_id: recipient,
            message: content || null,
            status: "pending",
          }));

          const { error: frError } = await supabase
            .from("vk_friend_requests")
            .insert(friendRequestRecords);

          if (frError) {
            console.error("Error creating friend request records:", frError);
          }
        }

        // Simulate sending with random success/failure
        const sent = Math.floor(recipients.length * (0.85 + Math.random() * 0.1));
        const failed = recipients.length - sent;

        // Update campaign with simulated results
        const { error: updateError } = await supabase
          .from("vk_campaigns")
          .update({
            sent_count: sent,
            failed_count: failed,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        if (updateError) {
          console.error("Error updating campaign:", updateError);
        }

        // Update friend request statuses if applicable
        if (campaign_type === "friend_request") {
          await supabase
            .from("vk_friend_requests")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("status", "pending");
        }

        return new Response(JSON.stringify({
          success: true,
          campaign_id: campaign.id,
          total_recipients: recipients.length,
          sent_count: sent,
          failed_count: failed,
          message: `Campaign completed: ${sent} sent, ${failed} failed (simulation mode)`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_campaigns": {
        const { data: campaigns, error } = await supabase
          .from("vk_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({ campaigns }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "pause_campaign": {
        const { campaign_id } = params;

        const { error } = await supabase
          .from("vk_campaigns")
          .update({ status: "paused" })
          .eq("id", campaign_id)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "Campaign paused" }), {
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
