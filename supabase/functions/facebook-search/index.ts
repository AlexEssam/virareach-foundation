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
      const { search_type, keyword, region } = body;

      console.log(`Facebook search: type=${search_type}, keyword=${keyword}, region=${region}`);

      // Stub implementation - returns mock data
      // In production, this would integrate with Facebook Graph API or scraping service
      const mockPages = [
        {
          id: "page_" + Math.random().toString(36).substr(2, 9),
          name: `${keyword} Business Page`,
          category: "Business",
          followers: Math.floor(Math.random() * 100000),
          region: region || "Global",
          url: `https://facebook.com/page_example`,
        },
        {
          id: "page_" + Math.random().toString(36).substr(2, 9),
          name: `${keyword} Community`,
          category: "Community",
          followers: Math.floor(Math.random() * 50000),
          region: region || "Global",
          url: `https://facebook.com/community_example`,
        },
        {
          id: "page_" + Math.random().toString(36).substr(2, 9),
          name: `${keyword} Official`,
          category: "Brand",
          followers: Math.floor(Math.random() * 200000),
          region: region || "Global",
          url: `https://facebook.com/official_example`,
        },
      ];

      return new Response(JSON.stringify({ 
        success: true, 
        pages: mockPages,
        message: "Search completed (simulation mode)"
      }), {
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
