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
      const { extraction_type, source } = body;

      console.log(`WhatsApp extraction: type=${extraction_type}, source=${source}`);

      if (!extraction_type) {
        return new Response(JSON.stringify({ error: "Missing extraction_type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create extraction job record
      const { data: extraction, error: insertError } = await supabase
        .from("whatsapp_extractions")
        .insert({
          user_id: user.id,
          extraction_type,
          source,
          status: "running",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating extraction:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate mock results based on extraction type
      const mockResults = generateMockResults(extraction_type, source);

      // Update extraction with results
      const { error: updateError } = await supabase
        .from("whatsapp_extractions")
        .update({
          status: "completed",
          result_count: mockResults.length,
          results: mockResults,
          completed_at: new Date().toISOString(),
        })
        .eq("id", extraction.id);

      if (updateError) {
        console.error("Error updating extraction:", updateError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        extraction_id: extraction.id,
        results: mockResults,
        result_count: mockResults.length,
        message: `Extracted ${mockResults.length} contacts (simulation mode)`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Get user's extractions
      const { data, error } = await supabase
        .from("whatsapp_extractions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching extractions:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ extractions: data }), {
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

function generateMockResults(extractionType: string, source?: string): any[] {
  const count = Math.floor(Math.random() * 100) + 20;
  const results = [];

  const countryPrefixes = ["+1", "+44", "+91", "+55", "+234", "+62", "+52"];

  for (let i = 0; i < count; i++) {
    const prefix = countryPrefixes[Math.floor(Math.random() * countryPrefixes.length)];
    const number = Math.floor(Math.random() * 9000000000) + 1000000000;
    
    results.push({
      id: `contact_${Math.random().toString(36).substr(2, 9)}`,
      phone: `${prefix}${number}`,
      name: `Contact ${i + 1}`,
      source: source || extractionType,
      extracted_from: extractionType,
      has_whatsapp: true,
      last_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      extracted_at: new Date().toISOString(),
    });
  }

  return results;
}
