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

      // Analyze group
      if (!action || action === "analyze") {
        const { group_url, group_id } = body;

        console.log(`Facebook group analysis: url=${group_url}, id=${group_id}`);

        const mockAnalysis = {
          group_id: group_id || extractGroupId(group_url),
          name: "Sample Facebook Group",
          members_count: Math.floor(Math.random() * 100000) + 1000,
          type: ["Public", "Private", "Closed"][Math.floor(Math.random() * 3)],
          url: group_url || `https://facebook.com/groups/${group_id}`,
          created_date: "2020-01-15",
          posts_per_day: Math.floor(Math.random() * 50) + 5,
          engagement_rate: (Math.random() * 10 + 1).toFixed(2) + "%",
          top_posting_times: ["9:00 AM", "12:00 PM", "6:00 PM", "9:00 PM"],
          admin_count: Math.floor(Math.random() * 10) + 1,
          recent_growth: `+${Math.floor(Math.random() * 1000)} members this month`,
          analyzed_at: new Date().toISOString(),
        };

        return new Response(JSON.stringify({ 
          success: true, 
          analysis: mockAnalysis,
          message: "Group analysis completed (simulation mode)"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Convert post URL to ID
      if (action === "convert_post_url") {
        const { post_url } = body;

        console.log(`Converting post URL: ${post_url}`);

        const mockPostId = extractPostId(post_url);

        return new Response(JSON.stringify({ 
          success: true, 
          post_id: mockPostId,
          original_url: post_url,
          message: "Post ID extracted (simulation mode)"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
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

function extractGroupId(url: string): string {
  if (!url) return "unknown_group";
  const match = url.match(/groups\/(\d+)/);
  return match ? match[1] : "group_" + Math.random().toString(36).substr(2, 9);
}

function extractPostId(url: string): string {
  if (!url) return "unknown_post";
  const match = url.match(/posts\/(\d+)/) || url.match(/\/(\d+)\/?$/);
  return match ? match[1] : "post_" + Math.random().toString(36).substr(2, 12);
}