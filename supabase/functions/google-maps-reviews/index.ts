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
    console.log(`Google Maps Reviews action: ${action}`, params);

    switch (action) {
      case "generate_review": {
        const { business_name, business_url, review_text, rating } = params;

        // Check daily limit (safety feature)
        const today = new Date().toISOString().split("T")[0];
        const { data: todayReviews, error: countError } = await supabase
          .from("google_maps_review_generations")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00Z`);

        if (countError) throw countError;

        const dailyLimit = 3; // Safety limit
        if ((todayReviews?.length || 0) >= dailyLimit) {
          return new Response(
            JSON.stringify({ error: `Daily limit of ${dailyLimit} reviews reached` }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create review generation record
        const { data: generation, error: insertError } = await supabase
          .from("google_maps_review_generations")
          .insert({
            user_id: user.id,
            business_name,
            business_url,
            review_text,
            rating,
            status: "pending",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        // Simulate review posting (in production, this would use automation)
        console.log(`Review queued for business: ${business_name}`);

        // Update status to simulate processing
        setTimeout(async () => {
          await supabase
            .from("google_maps_review_generations")
            .update({
              status: Math.random() > 0.2 ? "posted" : "failed",
              posted_at: new Date().toISOString(),
            })
            .eq("id", generation.id);
        }, 5000);

        return new Response(
          JSON.stringify({
            success: true,
            generation_id: generation.id,
            message: "Review queued for posting",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_generations": {
        const { data, error } = await supabase
          .from("google_maps_review_generations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify({ generations: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_daily_count": {
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("google_maps_review_generations")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00Z`);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            count: data?.length || 0,
            limit: 3,
            remaining: 3 - (data?.length || 0),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Google Maps Reviews error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
