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
    console.log(`Snapchat send action: ${action}`, params);

    switch (action) {
      case "create_campaign": {
        const {
          campaign_name,
          message_type,
          content,
          media_url,
          whatsapp_link,
          recipients,
          account_id,
          min_interval,
          max_interval,
        } = params;

        // Create campaign record
        const { data: campaign, error: insertError } = await supabase
          .from("snapchat_campaigns")
          .insert({
            user_id: user.id,
            campaign_name,
            message_type,
            content,
            media_url,
            whatsapp_link,
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

        // Create individual message records for tracking
        const messageRecords = recipients.map((recipient: string) => ({
          user_id: user.id,
          campaign_id: campaign.id,
          account_id: account_id === "rotate" ? null : account_id,
          recipient_username: recipient,
          message_type,
          content,
          media_url,
          status: "pending",
        }));

        const { error: messagesError } = await supabase
          .from("snapchat_messages")
          .insert(messageRecords);

        if (messagesError) {
          console.error("Error creating message records:", messagesError);
        }

        // Simulate sending (in production, this would be actual API calls)
        const sent = Math.floor(recipients.length * 0.9);
        const failed = recipients.length - sent;

        // Update campaign with simulated results
        const { error: updateError } = await supabase
          .from("snapchat_campaigns")
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

        return new Response(JSON.stringify({
          success: true,
          campaign_id: campaign.id,
          total_recipients: recipients.length,
          sent_count: sent,
          failed_count: failed,
          message: `Campaign started: ${sent} sent, ${failed} failed (simulation mode)`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_campaigns": {
        const { data: campaigns, error } = await supabase
          .from("snapchat_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({ campaigns }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_campaign_report": {
        const { campaign_id } = params;

        const { data: messages, error } = await supabase
          .from("snapchat_messages")
          .select("*")
          .eq("campaign_id", campaign_id)
          .eq("user_id", user.id);

        if (error) throw error;

        const report = {
          total: messages.length,
          sent: messages.filter(m => m.status === "sent").length,
          failed: messages.filter(m => m.status === "failed").length,
          pending: messages.filter(m => m.status === "pending").length,
          messages,
        };

        return new Response(JSON.stringify(report), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "pause_campaign": {
        const { campaign_id } = params;

        const { error } = await supabase
          .from("snapchat_campaigns")
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
