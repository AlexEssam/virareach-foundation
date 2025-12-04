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
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { extraction_id, format } = await req.json();
    console.log(`Google Maps Export: extraction=${extraction_id}, format=${format}`);

    // Fetch extraction data
    const { data: extraction, error: fetchError } = await supabase
      .from("google_maps_extractions")
      .select("*")
      .eq("id", extraction_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !extraction) {
      return new Response(JSON.stringify({ error: "Extraction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch businesses for this extraction
    const { data: businesses, error: bizError } = await supabase
      .from("google_maps_businesses")
      .select("*")
      .eq("extraction_id", extraction_id)
      .eq("user_id", user.id);

    if (bizError) throw bizError;

    let content: string;
    
    if (format === "csv") {
      content = generateCSV(businesses || []);
    } else {
      // For Excel, we'll generate CSV that Excel can open
      // In a production app, you'd use a proper Excel library
      content = generateCSV(businesses || []);
    }

    return new Response(
      JSON.stringify({
        success: true,
        content,
        filename: `extraction_${extraction_id}.${format === "csv" ? "csv" : "csv"}`,
        record_count: businesses?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Google Maps Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateCSV(businesses: any[]): string {
  if (businesses.length === 0) {
    return "No data to export";
  }

  const headers = [
    "Business Name",
    "Category",
    "Rating",
    "Review Count",
    "Phone Number",
    "Email",
    "Address",
    "Website",
    "Latitude",
    "Longitude",
  ];

  const rows = businesses.map((b) => [
    escapeCSV(b.business_name || ""),
    escapeCSV(b.category || ""),
    b.rating || "",
    b.review_count || "",
    escapeCSV(b.phone_number || ""),
    escapeCSV(b.email || ""),
    escapeCSV(b.address || ""),
    escapeCSV(b.website || ""),
    b.latitude || "",
    b.longitude || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
