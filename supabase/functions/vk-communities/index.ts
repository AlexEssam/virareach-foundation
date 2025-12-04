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
    console.log(`VK communities action: ${action}`, params);

    switch (action) {
      case "search": {
        const { query } = params;
        
        // Generate mock search results
        const count = Math.floor(Math.random() * 15) + 5;
        const communities = [];
        
        const types = ["group", "public", "event"];
        
        for (let i = 0; i < count; i++) {
          communities.push({
            user_id: user.id,
            community_vk_id: `club${Math.floor(Math.random() * 900000000) + 100000000}`,
            community_name: `${query} Community ${i + 1}`,
            community_type: types[Math.floor(Math.random() * types.length)],
            member_count: Math.floor(Math.random() * 100000) + 100,
            description: `A community about ${query}. Join us for discussions and content!`,
            status: "discovered",
          });
        }

        // Insert communities
        const { error: insertError } = await supabase
          .from("vk_communities")
          .insert(communities);

        if (insertError) {
          console.error("Error inserting communities:", insertError);
        }

        return new Response(JSON.stringify({
          success: true,
          count: communities.length,
          message: `Found ${communities.length} communities (simulation mode)`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "analyze": {
        const { community_url } = params;
        
        // Extract community ID from URL or use directly
        const communityId = community_url.includes("vk.com") 
          ? community_url.split("/").pop() 
          : community_url;

        const memberCount = Math.floor(Math.random() * 500000) + 1000;

        // Create or update community with analysis
        const { data: community, error: upsertError } = await supabase
          .from("vk_communities")
          .upsert({
            user_id: user.id,
            community_vk_id: communityId,
            community_name: `Community ${communityId}`,
            community_type: "public",
            member_count: memberCount,
            description: "Analyzed community with complete member data extraction capability",
            status: "analyzed",
          }, { onConflict: "id" })
          .select()
          .single();

        if (upsertError) {
          console.error("Error analyzing community:", upsertError);
        }

        return new Response(JSON.stringify({
          success: true,
          community_id: communityId,
          member_count: memberCount,
          analysis: {
            active_members: Math.floor(memberCount * 0.3),
            posts_per_day: Math.floor(Math.random() * 50) + 5,
            engagement_rate: (Math.random() * 10 + 1).toFixed(2) + "%",
            top_interests: ["technology", "business", "education"],
            demographics: {
              male: Math.floor(Math.random() * 40) + 30,
              female: Math.floor(Math.random() * 40) + 30,
              age_18_24: Math.floor(Math.random() * 20) + 10,
              age_25_34: Math.floor(Math.random() * 30) + 20,
              age_35_plus: Math.floor(Math.random() * 30) + 10,
            }
          },
          message: `Community analyzed: ${memberCount.toLocaleString()} members (simulation mode)`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "join": {
        const { community_id } = params;

        const { error } = await supabase
          .from("vk_communities")
          .update({ 
            is_joined: true, 
            joined_at: new Date().toISOString(),
            status: "joined"
          })
          .eq("community_vk_id", community_id)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Joined community (simulation mode)" 
        }), {
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
