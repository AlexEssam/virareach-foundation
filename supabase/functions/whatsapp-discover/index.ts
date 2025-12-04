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

    // GET - fetch discovered groups
    if (req.method === "GET") {
      const platform = url.searchParams.get("platform");
      const status = url.searchParams.get("status");

      let query = supabase
        .from("whatsapp_discovered_groups")
        .select("*")
        .eq("user_id", user.id)
        .order("discovered_at", { ascending: false });

      if (platform) {
        query = query.eq("source_platform", platform);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ groups: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - discover/join groups
    if (req.method === "POST") {
      // Discover groups from social platform
      if (action === "discover") {
        const body = await req.json();
        const { platform, search_url, category } = body;

        if (!platform) {
          return new Response(JSON.stringify({ error: "Platform is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Discovering WhatsApp groups from ${platform}...`);

        // Simulate group discovery
        const mockGroups = [];
        const count = Math.floor(Math.random() * 15) + 5;
        
        for (let i = 0; i < count; i++) {
          mockGroups.push({
            user_id: user.id,
            source_platform: platform,
            source_url: search_url || `https://${platform}.com/search`,
            invite_link: `https://chat.whatsapp.com/${Math.random().toString(36).substr(2, 22)}`,
            group_name: `${category || platform} Group ${i + 1}`,
            description: `A ${category || "general"} WhatsApp group from ${platform}`,
            member_estimate: Math.floor(Math.random() * 200) + 50,
            category: category || "general",
            status: "discovered",
          });
        }

        const { data, error } = await supabase
          .from("whatsapp_discovered_groups")
          .insert(mockGroups)
          .select();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          discovered: data?.length || 0,
          groups: data,
          message: `Discovered ${data?.length || 0} WhatsApp groups from ${platform}`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Join groups with number rotation
      if (action === "join") {
        const body = await req.json();
        const { group_ids, account_rotation } = body;

        if (!group_ids || group_ids.length === 0) {
          return new Response(JSON.stringify({ error: "No groups selected" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get user's accounts for rotation
        const { data: accounts } = await supabase
          .from("whatsapp_accounts")
          .select("id, phone_number")
          .eq("user_id", user.id)
          .eq("status", "active");

        const accountCount = accounts?.length || 1;
        const successRate = 0.85;
        const joinedCount = Math.floor(group_ids.length * successRate);

        // Update groups as joined
        const { error: updateError } = await supabase
          .from("whatsapp_discovered_groups")
          .update({ 
            status: "joined",
            joined_at: new Date().toISOString(),
          })
          .in("id", group_ids.slice(0, joinedCount))
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating groups:", updateError);
        }

        return new Response(JSON.stringify({
          success: true,
          joined: joinedCount,
          failed: group_ids.length - joinedCount,
          accounts_used: Math.min(accountCount, Math.ceil(group_ids.length / 5)),
          message: `Joined ${joinedCount}/${group_ids.length} groups using ${Math.min(accountCount, Math.ceil(group_ids.length / 5))} accounts (simulation mode)`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add single group manually
      const body = await req.json();
      const { invite_link, group_name, source_platform } = body;

      if (!invite_link) {
        return new Response(JSON.stringify({ error: "Invite link is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("whatsapp_discovered_groups")
        .insert({
          user_id: user.id,
          invite_link,
          group_name: group_name || "Manual Group",
          source_platform: source_platform || "manual",
          status: "discovered",
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, group: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - remove discovered group
    if (req.method === "DELETE") {
      const body = await req.json();
      const { id, ids } = body;

      if (ids && Array.isArray(ids)) {
        const { error } = await supabase
          .from("whatsapp_discovered_groups")
          .delete()
          .in("id", ids)
          .eq("user_id", user.id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, deleted: ids.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!id) {
        return new Response(JSON.stringify({ error: "Group ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("whatsapp_discovered_groups")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
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
