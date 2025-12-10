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
    const actionFromUrl = url.searchParams.get("action");

    if (req.method === "POST") {
      const body = await req.json();
      const action = (body.action || actionFromUrl) as string | null;

      // Action: Join groups
      if (action === "join") {
        const { group_urls, account_id } = body;

        if (!group_urls || group_urls.length === 0) {
          return new Response(JSON.stringify({ error: "No group URLs provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Facebook groups join: ${group_urls.length} groups`);

        const groups = group_urls.map((url: string, index: number) => ({
          user_id: user.id,
          account_id,
          group_url: url,
          group_name: `Group ${index + 1}`,
          group_id: `group_${Math.random().toString(36).substr(2, 9)}`,
          member_count: Math.floor(Math.random() * 10000) + 100,
          can_post: Math.random() > 0.2,
          has_rules: Math.random() > 0.5,
          status: "active",
          joined_at: new Date().toISOString(),
        }));

        const { data: insertedGroups, error: insertError } = await supabase
          .from("facebook_groups")
          .insert(groups)
          .select();

        if (insertError) {
          console.error("Error joining groups:", insertError);
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          joined_count: insertedGroups.length,
          groups: insertedGroups,
          message: `Joined ${insertedGroups.length} groups (simulation mode)`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Action: Analyze group posting availability
      if (action === "analyze") {
        const { group_id } = body;

        const { data: group, error: groupError } = await supabase
          .from("facebook_groups")
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

        const analysis = {
          can_post: group.can_post,
          has_rules: group.has_rules,
          post_restrictions: group.can_post ? null : "Posting requires admin approval",
          rules: group.has_rules ? [
            "No spam or promotional content",
            "Be respectful to other members",
            "Stay on topic",
          ] : [],
          best_posting_times: ["9:00 AM", "12:00 PM", "6:00 PM"],
          member_activity: Math.random() > 0.5 ? "high" : "medium",
        };

        await supabase
          .from("facebook_groups")
          .update({
            post_restrictions: analysis.post_restrictions,
          })
          .eq("id", group_id);

        return new Response(JSON.stringify({
          success: true,
          group_id,
          analysis,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Action: Extract groups by interest
      if (action === "extract") {
        const { interests, limit = 20 } = body;

        console.log(`Facebook groups extract: interests=${interests?.join(", ")}, limit=${limit}`);

        const mockGroups = [];
        for (let i = 0; i < Math.min(limit, 50); i++) {
          mockGroups.push({
            group_id: `group_${Math.random().toString(36).substr(2, 9)}`,
            group_name: `${interests?.[0] || "Interest"} Group ${i + 1}`,
            group_url: `https://facebook.com/groups/${Math.random().toString(36).substr(2, 9)}`,
            member_count: Math.floor(Math.random() * 50000) + 500,
            interests: interests || [],
            can_post: Math.random() > 0.3,
            is_public: Math.random() > 0.2,
          });
        }

        return new Response(JSON.stringify({
          success: true,
          groups: mockGroups,
          message: `Found ${mockGroups.length} groups matching interests (simulation mode)`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Action: Remove group
      if (action === "remove") {
        const { group_id } = body;

        const { error: deleteError } = await supabase
          .from("facebook_groups")
          .delete()
          .eq("id", group_id)
          .eq("user_id", user.id);

        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Left group successfully",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("facebook_groups")
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