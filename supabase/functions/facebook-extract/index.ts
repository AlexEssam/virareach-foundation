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
      const { extraction_type, source_url, source_id } = body;

      console.log(`Facebook extraction: type=${extraction_type}, url=${source_url}, id=${source_id}`);

      // Create extraction job record
      const { data: extraction, error: insertError } = await supabase
        .from("facebook_extractions")
        .insert({
          user_id: user.id,
          extraction_type,
          source_url,
          source_id,
          status: "pending",
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
      const mockResults = generateMockResults(extraction_type);

      // Update extraction with results
      const { error: updateError } = await supabase
        .from("facebook_extractions")
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
        message: `Extracted ${mockResults.length} ${extraction_type} (simulation mode)`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Get user's extractions
      const { data, error } = await supabase
        .from("facebook_extractions")
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

function generateMockResults(extractionType: string): any[] {
  const count = Math.floor(Math.random() * 50) + 10;
  const results = [];

  for (let i = 0; i < count; i++) {
    const baseData = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      extracted_at: new Date().toISOString(),
    };

    switch (extractionType) {
      case "post_likers":
      case "post_commenters":
        results.push({
          ...baseData,
          name: `User ${i + 1}`,
          profile_url: `https://facebook.com/user${i + 1}`,
          extracted_from: extractionType,
        });
        break;

      case "phone_numbers":
        results.push({
          ...baseData,
          name: `User ${i + 1}`,
          phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          profile_url: `https://facebook.com/user${i + 1}`,
        });
        break;

      case "demographics":
        results.push({
          ...baseData,
          name: `User ${i + 1}`,
          profile_url: `https://facebook.com/user${i + 1}`,
          age: Math.floor(Math.random() * 40) + 18,
          gender: Math.random() > 0.5 ? "Male" : "Female",
          job_title: ["Engineer", "Manager", "Designer", "Marketer", "Developer"][Math.floor(Math.random() * 5)],
          education: ["Bachelor's", "Master's", "PhD", "High School"][Math.floor(Math.random() * 4)],
          city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
          country: "United States",
          interests: ["Technology", "Business", "Marketing", "Sports", "Music"].slice(0, Math.floor(Math.random() * 3) + 1),
        });
        break;

      case "groups":
        results.push({
          ...baseData,
          group_id: `group_${Math.random().toString(36).substr(2, 9)}`,
          group_name: `Group ${i + 1}`,
          group_url: `https://facebook.com/groups/${Math.random().toString(36).substr(2, 9)}`,
          member_count: Math.floor(Math.random() * 50000) + 100,
          interests: ["Marketing", "Business", "Technology"][Math.floor(Math.random() * 3)],
          is_public: Math.random() > 0.3,
        });
        break;

      case "post_metadata":
        results.push({
          ...baseData,
          post_id: `post_${Math.random().toString(36).substr(2, 9)}`,
          content_type: ["text", "image", "video", "link"][Math.floor(Math.random() * 4)],
          likes_count: Math.floor(Math.random() * 5000),
          comments_count: Math.floor(Math.random() * 500),
          shares_count: Math.floor(Math.random() * 200),
          engagement_rate: (Math.random() * 10).toFixed(2) + "%",
          performance_score: Math.floor(Math.random() * 100),
          posted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;

      case "group_members":
        results.push({
          ...baseData,
          name: `Member ${i + 1}`,
          profile_url: `https://facebook.com/user${i + 1}`,
          role: Math.random() > 0.9 ? "Admin" : Math.random() > 0.7 ? "Moderator" : "Member",
          joined_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;

      case "page_followers":
        results.push({
          ...baseData,
          name: `Follower ${i + 1}`,
          profile_url: `https://facebook.com/user${i + 1}`,
          followed_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;

      case "friends":
        results.push({
          ...baseData,
          name: `Friend ${i + 1}`,
          profile_url: `https://facebook.com/user${i + 1}`,
          mutual_friends: Math.floor(Math.random() * 50),
          added_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;

      default:
        results.push({
          ...baseData,
          name: `User ${i + 1}`,
          profile_url: `https://facebook.com/user${i + 1}`,
          extracted_from: extractionType,
        });
    }
  }

  return results;
}
