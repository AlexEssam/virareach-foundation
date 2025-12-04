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

    // GET - fetch auto-reply rules
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("whatsapp_auto_replies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ rules: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - create auto-reply rule
    if (req.method === "POST") {
      const body = await req.json();
      const { name, trigger_type, trigger_keywords, response_content, response_media_url, account_id } = body;

      if (!name || !response_content) {
        return new Response(JSON.stringify({ error: "Name and response content are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("whatsapp_auto_replies")
        .insert({
          user_id: user.id,
          account_id,
          name,
          trigger_type: trigger_type || "keyword",
          trigger_keywords: trigger_keywords || [],
          response_content,
          response_media_url,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, rule: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - update auto-reply rule
    if (req.method === "PUT") {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Rule ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("whatsapp_auto_replies")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, rule: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - remove auto-reply rule
    if (req.method === "DELETE") {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Rule ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("whatsapp_auto_replies")
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
