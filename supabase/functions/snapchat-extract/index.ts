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

    const body = await req.json();
    const { extraction_type, source, niche } = body;

    console.log(`Snapchat extraction: type=${extraction_type}, source=${source}, niche=${niche}`);

    // Create extraction record
    const { data: extraction, error: insertError } = await supabase
      .from("snapchat_extractions")
      .insert({
        user_id: user.id,
        extraction_type,
        source,
        niche,
        status: "running",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating extraction:", insertError);
      throw insertError;
    }

    // Generate mock results based on extraction type
    const mockResults = generateMockResults(extraction_type, source, niche);

    // Update extraction with results
    const { error: updateError } = await supabase
      .from("snapchat_extractions")
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
      result_count: mockResults.length,
      results: mockResults,
      message: `Extracted ${mockResults.length} contacts (simulation mode)`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateMockResults(extractionType: string, source?: string, niche?: string): any[] {
  const count = Math.floor(Math.random() * 80) + 20;
  const results = [];

  const prefixes = ["snap", "user", "cool", "the", "real", "official"];
  const suffixes = ["123", "x", "_official", "real", "2024", ""];

  for (let i = 0; i < count; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const baseWord = niche ? niche.toLowerCase().slice(0, 5) : "user";
    
    results.push({
      id: `contact_${Math.random().toString(36).substr(2, 9)}`,
      username: `${prefix}${baseWord}${i}${suffix}`,
      display_name: `User ${i + 1}`,
      source: source || extractionType,
      niche: niche || null,
      extracted_from: extractionType,
      snap_score: Math.floor(Math.random() * 500000) + 1000,
      extracted_at: new Date().toISOString(),
    });
  }

  return results;
}
