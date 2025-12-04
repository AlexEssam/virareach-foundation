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

    const { action, params } = await req.json();
    console.log(`Google Maps Extract action: ${action}`, params);

    switch (action) {
      case "extract_businesses": {
        const { extraction_name, extraction_type, niche, city, country, search_query } = params;

        // Create extraction record
        const { data: extraction, error: insertError } = await supabase
          .from("google_maps_extractions")
          .insert({
            user_id: user.id,
            extraction_name,
            extraction_type,
            niche,
            city,
            country,
            search_query,
            status: "processing",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        // Generate mock business data
        const businesses = generateMockBusinesses(niche || search_query || "business", city, country, 15);

        // Save businesses to database
        const businessRecords = businesses.map((b) => ({
          user_id: user.id,
          extraction_id: extraction.id,
          ...b,
        }));

        const { error: businessError } = await supabase
          .from("google_maps_businesses")
          .insert(businessRecords);

        if (businessError) {
          console.error("Business insert error:", businessError);
        }

        // Update extraction with results
        const { error: updateError } = await supabase
          .from("google_maps_extractions")
          .update({
            status: "completed",
            result_count: businesses.length,
            results: businesses,
            completed_at: new Date().toISOString(),
          })
          .eq("id", extraction.id);

        if (updateError) {
          console.error("Update error:", updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            extraction_id: extraction.id,
            result_count: businesses.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "extract_reviews": {
        const { business_id } = params;

        // Generate mock reviews
        const reviews = generateMockReviews(10);

        // Save reviews to database
        const reviewRecords = reviews.map((r) => ({
          user_id: user.id,
          business_id,
          ...r,
        }));

        const { error: reviewError } = await supabase
          .from("google_maps_reviews")
          .insert(reviewRecords);

        if (reviewError) {
          console.error("Review insert error:", reviewError);
          throw reviewError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            review_count: reviews.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_extractions": {
        const { data, error } = await supabase
          .from("google_maps_extractions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify({ extractions: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Google Maps Extract error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateMockBusinesses(niche: string, city?: string, country?: string, count: number = 10) {
  const categories = ["Restaurant", "Hotel", "Cafe", "Store", "Service", "Healthcare", "Entertainment"];
  const streets = ["Main St", "Oak Ave", "Park Rd", "Business Blvd", "Commerce Dr", "Market St"];
  
  return Array.from({ length: count }, (_, i) => ({
    place_id: `place_${Date.now()}_${i}`,
    business_name: `${niche.charAt(0).toUpperCase() + niche.slice(1)} ${["Express", "Plus", "Pro", "Hub", "Center"][i % 5]} ${i + 1}`,
    phone_number: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    address: `${Math.floor(Math.random() * 9000) + 1000} ${streets[i % streets.length]}, ${city || "New York"}, ${country || "USA"}`,
    website: `https://www.${niche.toLowerCase().replace(/\s/g, "")}${i + 1}.com`,
    category: categories[i % categories.length],
    review_count: Math.floor(Math.random() * 500) + 10,
    opening_hours: {
      monday: "9:00 AM - 9:00 PM",
      tuesday: "9:00 AM - 9:00 PM",
      wednesday: "9:00 AM - 9:00 PM",
      thursday: "9:00 AM - 9:00 PM",
      friday: "9:00 AM - 10:00 PM",
      saturday: "10:00 AM - 10:00 PM",
      sunday: "10:00 AM - 8:00 PM",
    },
    latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
    longitude: -74.006 + (Math.random() - 0.5) * 0.1,
    email: `contact@${niche.toLowerCase().replace(/\s/g, "")}${i + 1}.com`,
    social_links: {
      facebook: `https://facebook.com/${niche.toLowerCase()}${i + 1}`,
      instagram: `https://instagram.com/${niche.toLowerCase()}${i + 1}`,
    },
  }));
}

function generateMockReviews(count: number = 10) {
  const names = ["John D.", "Sarah M.", "Mike R.", "Emily K.", "David L.", "Lisa P.", "Tom H.", "Anna S."];
  const reviewTexts = [
    "Great experience! Highly recommend.",
    "Good service, will come back again.",
    "Average experience, nothing special.",
    "Excellent staff and quality service.",
    "Very professional and friendly.",
    "Best place in town for this service.",
    "Decent prices and good location.",
    "Outstanding! Exceeded expectations.",
  ];

  return Array.from({ length: count }, (_, i) => ({
    review_id: `review_${Date.now()}_${i}`,
    reviewer_name: names[i % names.length],
    reviewer_profile_url: `https://maps.google.com/user/${i}`,
    rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
    review_text: reviewTexts[i % reviewTexts.length],
    review_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    response_text: Math.random() > 0.7 ? "Thank you for your feedback!" : null,
  }));
}
