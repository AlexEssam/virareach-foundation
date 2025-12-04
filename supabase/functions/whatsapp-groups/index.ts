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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "create") {
        // Create new WhatsApp group
        const { group_name, account_id } = body;
        
        if (!group_name) {
          return new Response(JSON.stringify({ error: "Group name is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Generate mock group data
        const mockGroupId = `group_${Math.random().toString(36).substr(2, 12)}`;
        const mockInviteLink = `https://chat.whatsapp.com/${Math.random().toString(36).substr(2, 22)}`;

        const { data: group, error: insertError } = await supabase
          .from("whatsapp_groups")
          .insert({
            user_id: user.id,
            account_id: account_id || null,
            group_name,
            group_id: mockGroupId,
            invite_link: mockInviteLink,
            member_count: 1, // Creator is first member
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating group:", insertError);
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`WhatsApp group created: ${group_name}`);

        return new Response(JSON.stringify({ 
          success: true, 
          group,
          message: `Group "${group_name}" created successfully (simulation mode)`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "add-members") {
        // Add members to group
        const { group_id, members } = body;
        
        if (!group_id || !members || members.length === 0) {
          return new Response(JSON.stringify({ error: "Group ID and members are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify group belongs to user
        const { data: group, error: groupError } = await supabase
          .from("whatsapp_groups")
          .select("*")
          .eq("id", group_id)
          .eq("user_id", user.id)
          .single();

        if (groupError || !group) {
          return new Response(JSON.stringify({ error: "Group not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Simulate adding members (250 per 3 minutes limit)
        const successRate = 0.88; // 88% success rate
        const successCount = Math.floor(members.length * successRate);
        const failedCount = members.length - successCount;

        // Update group member count
        const { error: updateError } = await supabase
          .from("whatsapp_groups")
          .update({
            member_count: group.member_count + successCount,
          })
          .eq("id", group_id);

        if (updateError) {
          console.error("Error updating group:", updateError);
        }

        console.log(`Added ${successCount}/${members.length} members to group ${group.group_name}`);

        return new Response(JSON.stringify({ 
          success: true, 
          added_count: successCount,
          failed_count: failedCount,
          new_member_count: group.member_count + successCount,
          message: `Added ${successCount}/${members.length} members (simulation mode)`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete") {
        const { group_id } = body;
        
        const { error } = await supabase
          .from("whatsapp_groups")
          .delete()
          .eq("id", group_id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting group:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (req.method === "GET") {
      // Get user's groups
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching groups:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ groups: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
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
